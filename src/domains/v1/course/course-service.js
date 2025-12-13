import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import courseQueryConfig from "./course-query-config.js";
import { CloudinaryService } from "../../../common/services/cloudinary-service.js";

class CourseService {
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinary = new CloudinaryService();
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

  async getAllMe(user) {
    const data = await this.prisma.course.findMany({
      where: {
        course_enrollments: {
          some: {
            user_id: user.id,
            role: {
              in: ["MEMBER", "MENTOR"],
            },
          },
        },
      },
      include: {
        course_enrollments: {
          where: {
            user_id: user.id,
          },
        },
      },
    });

    return {
      data,
      meta: null,
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

  async create(value, user, file) {
    if (file) {
      const uploadResult = await this.cloudinary.uploadFromBufferToCloudinary(
        file.buffer,
        "course/cover"
      );
      if (uploadResult) {
        value.cover_uri = uploadResult.secure_url;
      }
    }

    return await this.prisma.course.create({ data: value });
  }

  async update(id, value, user, file) {
    const exist = await this.prisma.course.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Course not found.");

    if (file) {
      if (exist.cover_uri != null) {
        try {
          await this.cloudinary.deleteFromUrlsCloudinary([exist.cover_uri]);
        } catch (error) {
          console.warn(
            "Gagal menghapus gambar lama (mungkin bukan file Cloudinary), lanjut update...",
            error.message
          );
        }
      }

      const uploadResult = await this.cloudinary.uploadFromBufferToCloudinary(
        file.buffer,
        "course/cover"
      );

      if (uploadResult) {
        value.cover_uri = uploadResult.secure_url;
      }
    }

    return await this.prisma.course.update({ where: { id }, data: value });
  }

  async delete(id, user) {
    const exist = await this.prisma.course.findFirst({ where: { id } });
    if (!exist) throw BaseError.notFound("Course not found.");

    if (exist.cover_uri != null) {
      try {
        await this.cloudinary.deleteFromUrlsCloudinary([exist.cover_uri]);
      } catch (error) {
        console.warn(
          "Gagal menghapus gambar lama saat delete course, lanjut delete data...",
          error.message
        );
      }
    }

    const deleted = await this.prisma.course.delete({ where: { id } });
    return { data: deleted, message: "Course permanently deleted." };
  }
}

export default new CourseService();
