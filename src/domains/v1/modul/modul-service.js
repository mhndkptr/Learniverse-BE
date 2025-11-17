import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import modulQueryConfig from "./modul-query-config.js";

class ModulService {
  constructor() {
    this.prisma = new PrismaService();
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

  async create(data) {
    const course = await this.prisma.course.findUnique({
      where: { id: data.course_id },
    });

    if (!course) {
      throw BaseError.notFound("Course not found");
    }

    const modul = await this.prisma.modul.create({
      data: {
        title: data.title,
        description: data.description,
        file_name: data.file_name,
        modul_uri: data.modul_uri,
        course_id: data.course_id,
      },
    });

    return modul;
  }

  async update(id, data) {
    const modulExists = await this.prisma.modul.findUnique({
      where: { id },
    });

    if (!modulExists) {
      throw BaseError.notFound("Modul not found");
    }

    const updated = await this.prisma.modul.update({
      where: { id },
      data,
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

    await this.prisma.modul.delete({
      where: { id },
    });

    return true;
  }
}

export default new ModulService();
