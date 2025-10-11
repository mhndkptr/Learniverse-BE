import prisma from "../../../common/services/prisma-service.js";
import path from "path";
import fs from "fs";

export const getAllCourses = async () => {
  return prisma.course.findMany({
    where: { deletedAt: null },
  });
};

export const getCourseById = async (id) => {
  return prisma.course.findUnique({
    where: { id },
  });
};

export const createCourse = async (data, mentorId) => {
  return prisma.course.create({
    data: {
      ...data,
      mentorId,
    },
  });
};

export const updateCourse = async (id, data) => {
  return prisma.course.update({
    where: { id },
    data,
  });
};

export const deleteCourse = async (id) => {
  return prisma.course.update({
    where: { id },
    data: { deletedAt: new Date() },
  });
};

// Upload materi file (PDF, PPT)
export const uploadMaterial = async (courseId, file) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error("Course not found");

  const uploadsDir = path.join(process.cwd(), "uploads", "materials");

  // Pastikan folder ada
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  const filePath = path.join(uploadsDir, file.originalname);

  fs.renameSync(file.path, filePath);

  return prisma.course.update({
    where: { id: courseId },
    data: { materialUrl: `/uploads/materials/${file.originalname}` },
  });
};
