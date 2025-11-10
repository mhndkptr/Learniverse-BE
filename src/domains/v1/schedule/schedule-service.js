import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";

class ScheduleService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll() {
    const schedules = await this.prisma.schedule.findMany({
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });
    return schedules;
  }

  async getById(id) {
    const schedule = await this.prisma.schedule.findUnique({
      where: { id },
      include: {
        course: {
          select: { id: true, title: true, code: true },
        },
      },
    });

    if (!schedule) throw BaseError.notFound("Schedule not found");
    return schedule;
  }

  async create(data) {
    const courseExists = await this.prisma.course.findUnique({
      where: { id: data.course_id },
    });
    if (!courseExists) throw BaseError.notFound("Course not found");

    const schedule = await this.prisma.schedule.create({ data });
    return schedule;
  }

  async update(id, data) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw BaseError.notFound("Schedule not found");

    const updated = await this.prisma.schedule.update({
      where: { id },
      data,
    });
    return updated;
  }

  async remove(id) {
    const schedule = await this.prisma.schedule.findUnique({ where: { id } });
    if (!schedule) throw BaseError.notFound("Schedule not found");

    await this.prisma.schedule.delete({ where: { id } });
    return { message: "Schedule deleted successfully" };
  }
}

export default new ScheduleService();
