import Joi from "joi";
import { PrismaService } from "../../../../common/services/prisma-service.js";
import BaseError from "../../../../base-classes/base-error.js";
import PaymentMethodType from "../../../../common/enums/payment-method-enum.js";
import MidtransService from "../../../../common/services/midtrans-service.js";
import CourseEnrollmentService from "../course-enrollment/course-enrollment-service.js";
import CourseEnrollmentRole from "../../../../common/enums/course-enrollment-role-enum.js";
import CourseTransactionStatus from "../../../../common/enums/course-transaction-status-enum.js";
import { format } from "date-fns";
import crypto from "crypto";
import Role from "../../../../common/enums/role-enum.js";
import { buildQueryOptions } from "../../../../utils/buildQueryOptions.js";
import courseTransactionQueryConfig from "./course-transaction-query-config.js";

class CourseTransactionService {
  constructor() {
    this.prisma = new PrismaService();
    this.midtrans = MidtransService;
    this.CourseEnrollmentService = CourseEnrollmentService;
  }

  async getAll(query, user) {
    const options = buildQueryOptions(courseTransactionQueryConfig, query);

    if (user.role === Role.STUDENT) {
      options.where.user_id = user.id;
    }

    const [data, count] = await Promise.all([
      this.prisma.courseTransaction.findMany(options),
      this.prisma.courseTransaction.count({ where: options.where }),
    ]);

    const page = query?.pagination?.page ?? 1;
    const limit = query?.pagination?.limit ?? 10;
    const totalPages = Math.ceil(count / limit);

    return {
      data,
      meta:
        query?.pagination?.page && query?.pagination?.limit
          ? {
              totalItems: count,
              totalPages,
              currentPage: page,
              itemsPerPage: limit,
            }
          : null,
    };
  }

  async create(value) {
    return this.prisma.$transaction(async (tx) => {
      const userExist = await tx.user.findFirst({
        where: {
          id: value.user_id,
        },
      });

      if (!userExist) {
        let validation = "";
        const stack = [];

        validation += "User not found.";

        stack.push({
          message: "User not found.",
          path: ["user_id"],
        });

        throw new Joi.ValidationError(validation, stack);
      }

      const courseExist = await tx.course.findFirst({
        where: {
          id: value.course_id,
        },
      });

      if (!courseExist) {
        let validation = "";
        const stack = [];

        validation += "Course not found.";

        stack.push({
          message: "Course not found.",
          path: ["course_id"],
        });

        throw new Joi.ValidationError(validation, stack);
      }

      if (!courseExist.is_open_registration_member) {
        throw BaseError.forbidden(
          "Course registration is not open for members"
        );
      }

      const enrollmentExist = await tx.courseEnrollment.findFirst({
        where: {
          user_id: value.user_id,
          course_id: value.course_id,
        },
      });

      if (enrollmentExist) {
        throw BaseError.badRequest("User is already enrolled in this course");
      }

      let courseTransaction = await tx.courseTransaction.create({
        data: {
          amount:
            Number(courseExist.price) +
            (Number(process.env.APP_PLATFORM_FEE_AMOUNT) || 0),
          user_id: value.user_id,
          course_id: value.course_id,
          status: CourseTransactionStatus.WAITING_PAYMENT,
        },
      });

      const parameter = {
        transaction_details: {
          order_id: courseTransaction.id,
          gross_amount:
            courseExist.price +
            (Number(process.env.APP_PLATFORM_FEE_AMOUNT) || 0),
        },
        credit_card: {
          secure: true,
        },
        customer_details: {
          first_name: userExist.name,
          email: userExist.email,
          phone: userExist.phone_number,
        },
        enabled_payments: [...Object.values(PaymentMethodType)],
        item_details: [
          {
            id: courseExist.id,
            price: courseExist.price,
            quantity: 1,
            name: courseExist.title,
          },
          {
            id: "platform_fee",
            price: Number(process.env.APP_PLATFORM_FEE_AMOUNT) || 0,
            quantity: 1,
            name: "Platform Fee",
          },
        ],
        metadata: {
          type: "course_transaction",
          id: courseTransaction.id,
        },
        expiry: {
          start_time: format(new Date(), "yyyy-MM-dd HH:mm:ss xx"),
          unit: "minutes",
          duration: Number(process.env.MIDTRANS_PAYMENT_DUE_MINUTES) || 60,
        },
      };

      const snap = await this.midtrans.snap.createTransaction(parameter);

      if (!snap) {
        throw new Error("Failed to create snap");
      }

      courseTransaction = await tx.courseTransaction.update({
        where: {
          id: courseTransaction.id,
        },
        data: {
          redirect_url: snap.redirect_url,
          transaction_token: snap.token,
        },
      });

      return { courseTransaction };
    });
  }

  async notify(value) {
    const hash = crypto
      .createHash("sha512")
      .update(
        `${value.order_id}${value.status_code}${value.gross_amount}${process.env.MIDTRANS_SERVER_KEY}`
      )
      .digest("hex");

    if (value.signature_key === hash) {
      if (!value.metadata) {
        return true;
      }

      if (value.metadata.type == "course_transaction") {
        return await this.updateWebhookMidtrans(value);
      }
    }

    return true;
  }

  async updateWebhookMidtrans(data) {
    const courseTransactionExist =
      await this.prisma.courseTransaction.findFirst({
        where: {
          id: data.order_id,
        },
      });

    if (data.transaction_status === "capture") {
      if (data.fraud_status === "accept") {
        if (courseTransactionExist) {
          await this.prisma.courseTransaction.update({
            where: {
              id: courseTransactionExist.id,
            },
            data: {
              status: data.transaction_status,
            },
          });
        }
      }
    } else if (data.transaction_status === "settlement") {
      if (courseTransactionExist) {
        await this.prisma.courseTransaction.update({
          where: { id: courseTransactionExist.id },
          data: {
            status: data.transaction_status,
            settlement_time: new Date(),
          },
        });

        await this.CourseEnrollmentService.create({
          user_id: courseTransactionExist.user_id,
          course_id: courseTransactionExist.course_id,
          course_transaction_id: courseTransactionExist.id,
          role: CourseEnrollmentRole.MEMBER,
        });
      }
    } else if (
      data.transaction_status === "cancel" ||
      data.transaction_status === "deny" ||
      data.transaction_status === "expire"
    ) {
      if (courseTransactionExist) {
        await this.prisma.courseTransaction.update({
          where: {
            id: courseTransactionExist.id,
          },
          data: {
            status: data.transaction_status,
          },
        });
      }
    } else if (data.transaction_status === "pending") {
      if (courseTransactionExist) {
        await this.prisma.courseTransaction.update({
          where: {
            id: courseTransactionExist.id,
          },
          data: {
            transaction_id: data.transaction_id,
            status: data.transaction_status,
            payment_method: data.payment_type,
          },
        });
      }
    }

    return true;
  }
}

export default new CourseTransactionService();
