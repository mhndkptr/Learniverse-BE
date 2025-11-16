import { PrismaService } from "../../../common/services/prisma-service.js";
import Joi from "joi";

class CourseEnrollmentService {
  constructor() {
    this.prisma = new PrismaService();
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

    const courseEnrollment = await this.prisma.courseEnrollment.create({
      data: value,
    });

    return { courseEnrollment };
  }
}

export default new CourseEnrollmentService();
