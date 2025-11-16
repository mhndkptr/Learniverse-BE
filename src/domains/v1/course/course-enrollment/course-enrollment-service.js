import BaseError from "../../../../base-classes/base-error.js";
import Role from "../../../../common/enums/role-enum.js";
import { PrismaService } from "../../../../common/services/prisma-service.js";
import Joi from "joi";

class CourseEnrollmentService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(user) {
    const query = {};

    if (user.role === Role.STUDENT) {
      query.user_id = user.id;
    }

    const courseEnrollments = await this.prisma.courseEnrollment.findMany({
      where: query,
      include: {
        course: true,
        user: true,
        course_transaction: true,
      },
    });

    return courseEnrollments;
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

    if (value.course_transaction_id) {
      const transactionExist = await this.prisma.courseTransaction.findFirst({
        where: {
          id: value.course_transaction_id,
        },
      });

      if (!transactionExist) {
        let validation = "";
        const stack = [];

        validation += "Course Transaction not found.";

        stack.push({
          message: "Course Transaction not found.",
          path: ["course_transaction_id"],
        });

        throw new Joi.ValidationError(validation, stack);
      }
    }

    const existingEnrollment = await this.prisma.courseEnrollment.findFirst({
      where: {
        user_id: value.user_id,
        course_id: value.course_id,
      },
    });

    if (existingEnrollment) {
      throw BaseError.badRequest("User is already enrolled in this course.");
    }

    const courseEnrollment = await this.prisma.courseEnrollment.create({
      data: value,
    });

    return { courseEnrollment };
  }
}

export default new CourseEnrollmentService();
