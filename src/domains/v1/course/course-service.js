import Joi from "joi";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import courseQueryConfig from "./course-query-config.js";
import Role from "../../../common/enums/role-enum.js";

class CourseService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query = {}) {
    const options = buildQueryOptions(courseQueryConfig, query);

    const [data, count] = await Promise.all([
      this.prisma.course.findMany({
        ...options,
        include: {
          mentors: {
            select: {
              id: true,
              bio: true,
              reason: true,
              motivation: true,
              cv_uri: true,
              portfolio_uri: true,
              status: true,
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                },
              },
            },
          },
          schedules: true,
          moduls: true,
          quizzes: true,
        },
      }),
      this.prisma.course.count({ where: options.where }),
    ]);

    const page = query?.pagination?.page ?? 1;
    const limit = query?.pagination?.limit ?? 10;
    const totalPages = Math.ceil(count / limit);

    return {
      data,
      meta: {
        totalItems: count,
        totalPages,
        currentPage: page,
        itemsPerPage: limit,
      },
    };
  }

  async getById(id) {
    const data = await this.prisma.course.findFirst({
      where: { id },
      include: {
        mentors: {
          select: {
            id: true,
            bio: true,
            reason: true,
            motivation: true,
            cv_uri: true,
            portfolio_uri: true,
            status: true,
            user: {
              select: {
                id: true,
                name: true,
                email: true,
              },
            },
          },
        },
        schedules: true,
        moduls: true,
        quizzes: true,
      },
    });

    if (!data) throw BaseError.notFound("Course not found.");
    return data;
  }

  async create(value, user) {
    return await this.prisma.course.create({ data: value });
  }

  async update(id, value, user) {
    const exist = await this.prisma.course.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Course not found.");

    return await this.prisma.course.update({ where: { id }, data: value });
  }

  async delete(id, user) {
    const exist = await this.prisma.course.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Course not found.");

    const deleted = await this.prisma.course.delete({ where: { id } });
    return { data: deleted, message: "Course permanently deleted." };
  }
}

export default new CourseService();
