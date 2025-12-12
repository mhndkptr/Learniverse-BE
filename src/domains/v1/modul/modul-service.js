import BaseError from "../../../base-classes/base-error.js";
import { CloudinaryService } from "../../../common/services/cloudinary-service.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import modulQueryConfig from "./modul-query-config.js";

class ModulService {
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinary = new CloudinaryService();
  }

  async getAll(query = {}) {
    const options = buildQueryOptions(modulQueryConfig, query);

    const [data, count] = await Promise.all([
      this.prisma.modul.findMany(options),
      this.prisma.modul.count({ where: options.where }),
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
    const modul = await this.prisma.modul.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    if (!modul) {
      throw BaseError.notFound("Modul not found");
    }

    return modul;
  }

  async create(value, file) {
    const course = await this.prisma.course.findUnique({
      where: { id: value.course_id },
    });

    if (!course) {
      throw BaseError.notFound("Course not found");
    }

    if (file) {
      const uploadResult = await this.cloudinary.uploadFromBufferToCloudinary(
        file.buffer,
        "course/module"
      );
      if (uploadResult) {
        value.modul_uri = uploadResult.secure_url;
      }
    }

    const modul = await this.prisma.modul.create({
      data: {
        title: value.title,
        description: value.description,
        file_name: value.file_name,
        modul_uri: value.modul_uri,
        course_id: value.course_id,
      },
    });

    return modul;
  }

  async update(id, value, file) {
    const modulExists = await this.prisma.modul.findUnique({
      where: { id },
    });

    if (!modulExists) {
      throw BaseError.notFound("Modul not found");
    }

    if (file) {
      if (modulExists.modul_uri != null) {
        await this.cloudinary.deleteFromUrlsCloudinary([modulExists.modul_uri]);
      }

      const uploadResult = await this.cloudinary.uploadFromBufferToCloudinary(
        file.buffer,
        "course/module"
      );

      if (uploadResult) {
        value.modul_uri = uploadResult.secure_url;
      }
    }

    const updated = await this.prisma.modul.update({
      where: { id },
      data: value,
    });

    return updated;
  }

  async remove(id) {
    const modul = await this.prisma.modul.findUnique({
      where: { id },
    });

    if (!modul) {
      throw BaseError.notFound("Modul not found");
    }

    if (modul.modul_uri != null) {
      await this.cloudinary.deleteFromUrlsCloudinary([modul.modul_uri]);
    }

    await this.prisma.modul.delete({
      where: { id },
    });

    return true;
  }
}

export default new ModulService();
