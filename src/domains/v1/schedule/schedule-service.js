import Joi from "joi";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import scheduleQueryConfig from "./schedule-query-config.js";
import Role from "../../../common/enums/role-enum.js";

class ScheduleService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(scheduleQueryConfig, query);

    const [data, count] = await Promise.all([
      this.prisma.schedule.findMany(options),
      this.prisma.schedule.count({
        where: options.where,
      }),
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

  async getById(id) {
    const data = await this.prisma.schedule.findFirst({
      where: { id },
      include: { course: true },
    });

    if (!data) throw BaseError.notFound("Schedule not found");
    return data;
  }

  async create(value, user) {
    if (user.role !== Role.ADMIN) {
      const mentor = await this.prisma.mentor.findFirst({
        where: {
          user_id: user.id,
          course_id: value.course_id,
        },
      });

      if (!mentor) throw BaseError.forbidden("Only mentors can create schedule");
    }

    const courseExists = await this.prisma.course.findFirst({
      where: { id: value.course_id },
    });

    if (!courseExists) {
      const validation = "Course not found";
      const stack = [{ message: validation, path: ["course_id"] }];
      throw new Joi.ValidationError(validation, stack);
    }

    const data = await this.prisma.schedule.create({ data: value });
    return data;
  }

  async update(id, value, user) {
    const existing = await this.prisma.schedule.findFirst({
      where: { id },
    });

    if (!existing) throw BaseError.notFound("Schedule not found");

    if (user.role !== Role.ADMIN) {
      const mentor = await this.prisma.mentor.findFirst({
        where: {
          user_id: user.id,
          course_id: existing.course_id,
        },
      });

      if (!mentor) throw BaseError.forbidden("Only mentors can update schedule");
    }

    const data = await this.prisma.schedule.update({
      where: { id },
      data: value,
    });

    return data;
  }

  async delete(id, user) {
    const existing = await this.prisma.schedule.findFirst({
      where: { id },
    });

    if (!existing) throw BaseError.notFound("Schedule not found");

    if (user.role !== Role.ADMIN) {
      const mentor = await this.prisma.mentor.findFirst({
        where: {
          user_id: user.id,
          course_id: existing.course_id,
        },
      });

      if (!mentor) throw BaseError.forbidden("Only mentors can delete schedule");
    }

    const deleted = await this.prisma.schedule.delete({
      where: { id },
    });

    return {
      data: deleted,
      message: "Schedule permanently deleted",
    };
  }
}

export default new ScheduleService();
