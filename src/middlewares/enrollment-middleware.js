import { PrismaService } from "../common/services/prisma-service.js";
import BaseError from "../base-classes/base-error.js";

class EnrollmentMiddleware {
  constructor() {
    this.prisma = new PrismaService();
  }

  /**
   * Mengecek status enrollment user pada course tertentu.
   *
   * Requirement:
   * 1. AuthMiddleware harus dijalankan sebelumnya (req.user harus ada).
   * 2. Route harus memiliki parameter `course_id` (di params, body, atau query).
   *
   * Output:
   * Menambahkan `req.courseEnrollment` dan `req.enrollmentRole` ke request object.
   */
  check = async (req, res, next) => {
    try {
      // 1. Validasi User dari AuthMiddleware
      if (!req.user || !req.user.id) {
        return next(
          BaseError.internal(
            "User context missing. Place AuthMiddleware before EnrollmentMiddleware."
          )
        );
      }

      // 2. Deteksi Course ID
      // Prioritas: req.params.course_id -> req.body.course_id -> req.query.course_id
      // Sesuaikan 'course_id' dengan nama parameter di route kamu (misal: /courses/:course_id/...)
      const courseId =
        req.params?.course_id ||
        req.params?.id || // Kadang route-nya cuma /courses/:id
        req.body?.course_id ||
        req.query?.course_id ||
        req.query?.filter?.course_id; // Misal di query params untuk filter

      if (!courseId) {
        // Jika tidak ada courseId konteks, anggap tidak ter-enroll
        req.courseEnrollment = null;
        req.enrollmentRole = "NOT_ENROLLED";
        return next();
      }

      // 3. Query Database
      // Mencari apakah ada record enrollment untuk user ini di course tersebut
      const enrollment = await this.prisma.courseEnrollment.findFirst({
        where: {
          user_id: req.user.id,
          course_id: courseId,
          // Opsional: Cek left_at jika kamu ingin menganggap yang sudah keluar (left) sebagai not enrolled
          left_at: null,
        },
        include: {
          course: true, // Include info course jika diperlukan di controller
        },
      });

      // 4. Attach Data ke Request Object
      if (enrollment) {
        // Status: MEMBER atau MENTOR
        req.courseEnrollment = enrollment;
        req.enrollmentRole = enrollment.role; // Enum: "MEMBER" | "MENTOR"
      } else {
        // Status: Tidak Terdaftar
        req.courseEnrollment = null;
        req.enrollmentRole = "NOT_ENROLLED";
      }

      next();
    } catch (error) {
      console.error("Enrollment Middleware Error:", error);
      return next(BaseError.internal("Error checking enrollment status"));
    }
  };
}

export default new EnrollmentMiddleware();
