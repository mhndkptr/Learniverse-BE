import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import path from "path";
import fs from "fs";

class CourseService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll() {
    return this.prisma.course.findMany({
      where: { deleted_at: null },
    });
  }

  async getById(id) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw BaseError.notFound("Course not found");
    return course;
  }

  async create(data) {
    const existing = await this.prisma.course.findFirst({
      where: { code: data.code },
    });
    if (existing) throw BaseError.duplicate("Course code already exists");

    const course = await this.prisma.course.create({ data });
    return course;
  }

  async update(id, data) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw BaseError.notFound("Course not found");

    const updated = await this.prisma.course.update({
      where: { id },
      data,
    });
    return updated;
  }

  async remove(id) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) throw BaseError.notFound("Course not found");

    await this.prisma.course.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: "Course deleted successfully" };
  }

  async uploadMaterial(courseId, file) {
    const course = await this.prisma.course.findUnique({ where: { id: courseId } });
    if (!course) throw BaseError.notFound("Course not found");
    if (!file) throw BaseError.badRequest("No file uploaded");

    const uploadsDir = path.join(process.cwd(), "uploads", "materials");
    if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

    const targetPath = path.join(uploadsDir, file.originalname);
    fs.renameSync(file.path, targetPath);

    const modul = await this.prisma.modul.create({
      data: {
        title: file.originalname,
        description: "",
        file_name: file.originalname,
        modul_uri: `/uploads/materials/${file.originalname}`,
        course_id: courseId,
      },
    });

    return modul;
  }
}

export default new CourseService();
