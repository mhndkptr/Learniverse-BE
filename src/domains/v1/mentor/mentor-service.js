import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import mentorQueryConfig from "./mentor-query-config.js";
import Role from "../../../common/enums/role-enum.js";

class MentorService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query = {}) {
    const options = buildQueryOptions(mentorQueryConfig, query);

    const [data, count] = await Promise.all([
      this.prisma.mentor.findMany(options),
      this.prisma.mentor.count({ where: options.where }),
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
    const data = await this.prisma.mentor.findFirst({
      where: { id },
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
        course: {
          select: {
            id: true,
            title: true,
            code: true,
          },
        },
      },
    });

    if (!data) throw BaseError.notFound("Mentor not found.");
    return data;
  }

  async create(value, user) {
    return await this.prisma.mentor.create({ data: value });
  }

  async update(id, value, user) {
    const exist = await this.prisma.mentor.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Mentor not found.");

    return await this.prisma.mentor.update({ where: { id }, data: value });
  }

  async delete(id, user) {
    const exist = await this.prisma.mentor.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Mentor not found.");

    const deleted = await this.prisma.mentor.delete({ where: { id } });
    return { data: deleted, message: "Mentor permanently deleted." };
  }
}

export default new MentorService();
