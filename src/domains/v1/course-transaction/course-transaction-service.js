import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import Joi from "joi";
import PaymentMethodType from "../../../common/enums/payment-method-enum.js";
import { buildDokuHeaders } from "../../../utils/dokuUtil.js";
import CourseTransactionStatus from "../../../common/enums/course-transaction-status-enum.js";
import axios from "axios";
import CourseEnrollmentService from "../course-enrollment/course-enrollment-service.js";
import CourseEnrollmentRole from "../../../common/enums/course-enrollment-role-enum.js";

class CourseTransactionService {
  constructor() {
    this.prisma = new PrismaService();
    this.CourseEnrollmentService = CourseEnrollmentService;
  }

  async create(value) {
    const userExist = await this.prisma.user.findFirst({
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

    const courseExist = await this.prisma.course.findFirst({
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
      throw BaseError.forbidden("Course registration is not open for members");
    }

    let courseTransaction = await this.prisma.courseTransaction.create({
      data: {
        amount: Number(courseExist.price),
        user_id: value.user_id,
        course_id: value.course_id,
        status: CourseTransactionStatus.PENDING,
      },
    });

    const shortUuid = courseTransaction.id.replace(/-/g, "").substring(0, 18);
    const timestampSeconds = Math.floor(Date.now() / 1000);

    // const checkoutBody = {
    //   order: {
    //     amount: Number(courseExist.price),
    //     invoice_number: `${shortUuid}${timestampSeconds}`,
    // currency: process.env.DOKU_CURRENCY || "IDR",
    // callback_url: "http://merchantcallbackurl.domain/",
    // callback_url_cancel: "https://merchantcallbackurl-cancel.domain",
    // callback_url_result: "https://merchantcallbackurl-cancel.domain",
    // language: "EN",
    // auto_redirect: true,
    // disable_retry_payment: true,
    // line_items: [
    //   {
    //     id: courseExist.id,
    //     name: courseExist.title,
    //     quantity: 1,
    //     price: Number(courseExist.price),
    //     sku: `LRNCRS-${courseExist.id}`,
    //     category: "others",
    //     url: `${process.env.APP_FRONTEND_URL}/course/${courseExist.id}`,
    //     image_url: courseExist.cover_uri,
    //     type: "COURSE",
    //   },
    // ],
    // },
    // payment: {
    //   payment_due_date: Number(process.env.DOKU_PAYMENT_DUE_MINUTES) || 60,
    //   type: "SALE",
    // payment_method_types: [...Object.values(PaymentMethodType)],
    // },
    // customer: {
    //   id: userExist.id,
    //   name: userExist.name,
    // },
    // };

    const checkoutBody = {
      order: {
        amount: Number(courseExist.price),
        invoice_number: `${shortUuid}${timestampSeconds}`,
        currency: "IDR",
        callback_url: "http://merchantcallbackurl.domain/",
        callback_url_cancel: "https://merchantcallbackurl-cancel.domain",
      },
      payment: {
        payment_due_date: 60,
        payment_method_types: ["QRIS"],
      },
      customer: {
        id: userExist.id,
        name: userExist.name,
      },
    };

    const jsonCheckoutBody = JSON.stringify(checkoutBody);

    const headers = buildDokuHeaders({
      body: checkoutBody,
      requestId: courseTransaction.id,
      requestTimestamp: new Date().toISOString(),
      requestTarget: "/checkout/v1/payment",
    });

    // const checkoutResponse = await axios.post(
    //   `${process.env.DOKU_API_URL}/checkout/v1/payment`,
    //   jsonCheckoutBody,
    //   {
    //     headers: headers,
    //   }
    // );

    const checkoutResponse = await fetch(
      `${process.env.DOKU_API_URL}/checkout/v1/payment`,
      {
        method: "POST",
        headers: headers,
        body: jsonCheckoutBody,
      }
    );

    console.log(headers);
    console.log(jsonCheckoutBody);

    console.log(checkoutResponse);

    if (checkoutResponse.status !== 200) {
      throw BaseError.badGateway(
        "DOKU Payment Gateway Error",
        `${
          checkoutResponse?.data?.message
            ? isArray(checkoutResponse?.data?.message)
              ? checkoutResponse?.data?.message.join(", ")
              : checkoutResponse?.data?.message
            : "Unknown Error From DOKU"
        }`
      );
    } else {
      courseTransaction = await this.prisma.courseTransaction.update({
        where: {
          id: courseTransaction.id,
        },
        data: {
          redirect_url: checkoutResponse.data?.response?.payment?.url,
          transaction_token: checkoutResponse.data?.response?.payment?.token_id,
        },
      });
    }

    return { courseTransaction };
  }

  async notify(value) {
    const invoiceNumberParts = value.order.invoice_number.split("--");
    const courseTransactionId = invoiceNumberParts[0];

    const courseTransactionExist =
      await this.prisma.courseTransaction.findFirst({
        where: {
          id: courseTransactionId,
        },
      });

    if (!courseTransactionExist) {
      throw BaseError.badRequest("Course transaction not found");
    }

    let updateValue = {
      status: value?.transaction?.status,
      payment_method: value?.channel?.id,
    };

    if (value?.transaction?.status === CourseTransactionStatus.SUCCESS) {
      updateValue.settlement_time = new Date(value.transaction.date);
    }

    await this.prisma.courseTransaction.update({
      where: {
        id: courseTransactionId,
      },
      data: updateValue,
    });

    if (value?.transaction?.status === CourseTransactionStatus.SUCCESS) {
      await this.CourseEnrollmentService.create({
        user_id: courseTransactionExist.user_id,
        course_id: courseTransactionExist.course_id,
        course_transaction_id: courseTransactionExist.id,
        role: CourseEnrollmentRole.MEMBER,
      });
    }
  }
}

export default new CourseTransactionService();
