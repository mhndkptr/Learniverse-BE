import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import mentorQueryConfig from "./mentor-query-config.js";
import MentorStatus from "../../../common/enums/mentor-status-enum.js";
import CourseEnrollmentRole from "../../../common/enums/course-enrollment-role-enum.js";

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
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            phone_number: true,
            profile_uri: true,
          },
        },
        course: {
          select: {
            id: true,
            title: true,
            code: true,
            price: true,
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

    const updated = await this.prisma.mentor.update({
      where: { id },
      data: value,
    });

    if (
      value.status === MentorStatus.ACCEPTED &&
      exist.status !== updated.status
    ) {
      const existingEnrollment = await this.prisma.courseEnrollment.findFirst({
        where: {
          user_id: updated.user_id,
          course_id: updated.course_id,
        },
      });

      if (!existingEnrollment) {
        await this.prisma.courseEnrollment.create({
          data: {
            user_id: updated.user_id,
            course_id: updated.course_id,
            role: CourseEnrollmentRole.MENTOR,
          },
        });
      }
    }

    return updated;
  }

  async delete(id, user) {
    const exist = await this.prisma.mentor.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Mentor not found.");

    const deleted = await this.prisma.mentor.delete({ where: { id } });
    return { data: deleted, message: "Mentor permanently deleted." };
  }
}

export default new MentorService();
