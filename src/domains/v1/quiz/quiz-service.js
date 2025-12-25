import Joi from "joi";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import QuizType from "../../../common/enums/quiz-enum.js";
import quizQueryConfig from "./quiz-query-config.js";
import ScheduleService from "../schedule/schedule-service.js";
import QuizAttemptStatus from "../../../common/enums/quiz-attempt-status-enum.js";

class QuizService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query, user, enrollmentRole) {
    const options = buildQueryOptions(quizQueryConfig, query);

    // 1. Filter ID Quiz
    if (query.advSearch?.quiz_id) {
      if (!options.where) options.where = {};
      options.where.id = query.advSearch.quiz_id;
    }

    // 2. Setup Include
    const includeConfig = {
      course: true,
      _count: {
        select: { quiz_questions: true },
      },
    };

    // 3. Cek Role Enrollment
    const isMember = user && enrollmentRole === "MEMBER";

    if (isMember) {
      includeConfig.quiz_attempts = {
        where: {
          user_id: user.id,
        },
        include: {
          quiz_attempt_question_answers: {
            include: {
              quiz_option_answer: true,
            },
          },
        },
      };
    }

    // 4. Eksekusi Query

    const [rawData, count] = await Promise.all([
      this.prisma.Quiz.findMany({
        ...options,
        include: includeConfig,
      }),
      this.prisma.Quiz.count({
        where: options.where,
      }),
    ]);

    // 5. Processing Data (Logic Validasi Attempt & Hitung Nilai)
    // Gunakan Promise.all karena kita mungkin melakukan update DB di dalam loop
    const dataWithGrade = await Promise.all(
      rawData.map(async (quiz) => {
        const totalQuestions = quiz._count?.quiz_questions || 0;
        let personalHighestGrade = null;
        let activeAttemptId = null; // Variable untuk menampung ID attempt yg masih jalan

        // Logika hanya jalan jika user MEMBER dan punya history attempt
        if (isMember && quiz.quiz_attempts?.length > 0) {
          // Kita tampung attempt yang valid untuk dinilai (sudah FINISHED)
          let finishedAttemptsForGrading = [];

          // Loop setiap attempt untuk pengecekan status
          for (const attempt of quiz.quiz_attempts) {
            // A. Kalo sudah FINISHED, langsung masuk antrian nilai
            if (attempt.status === "FINISHED") {
              finishedAttemptsForGrading.push(attempt);
              continue;
            }

            // B. Kalo ON_PROGRESS, kita cek apakah waktunya sudah habis
            if (attempt.status === "ON_PROGRESS") {
              const now = new Date();
              const quizEndDate = new Date(quiz.end_date);

              // Hitung kapan attempt ini harusnya selesai (start + duration menit)
              // quiz.duration asumsinya dalam menit
              const attemptExpiryTime = new Date(
                attempt.start_at.getTime() + quiz.duration * 60000
              );

              // Cek Kondisi Expired (Lewat durasi ATAU Lewat deadline kuis)
              const isTimeUp = now > attemptExpiryTime;
              const isDeadlinePassed = now > quizEndDate;

              if (isTimeUp || isDeadlinePassed) {
                // UPDATE KE DB: Force Finish karena waktu habis
                const updatedAttempt = await this.prisma.quizAttempt.update({
                  where: { id: attempt.id },
                  data: {
                    status: "FINISHED",
                    finish_at: now, // Set waktu selesai sekarang
                  },
                  include: {
                    quiz_attempt_question_answers: {
                      include: { quiz_option_answer: true },
                    },
                  },
                });

                // Masukkan attempt yang baru di-update ini ke perhitungan nilai
                finishedAttemptsForGrading.push(updatedAttempt);
              } else {
                // Masih valid ON_PROGRESS (Waktu masih ada)
                // Set active ID untuk dikirim ke frontend
                activeAttemptId = attempt.id;
              }
            }
          }

          // C. Hitung Nilai Tertinggi dari finishedAttemptsForGrading
          if (finishedAttemptsForGrading.length > 0 && totalQuestions > 0) {
            const grades = finishedAttemptsForGrading.map((attempt) => {
              const correctCount = attempt.quiz_attempt_question_answers.filter(
                (ans) => ans.quiz_option_answer?.is_correct === true
              ).length;

              return (correctCount / totalQuestions) * 100;
            });

            const maxScore = Math.max(...grades);
            personalHighestGrade = parseFloat(maxScore.toFixed(2));
          }
        }

        // Bersihkan object return
        const { quiz_attempts, _count, ...rest } = quiz;

        return {
          ...rest,
          quiz_attempts,
          total_questions: totalQuestions,
          personal_highest_grade: personalHighestGrade,
          active_attempt_id: activeAttemptId, // NULL jika tidak ada yg on-progress, isi string UUID jika ada
          is_attempted: isMember ? quiz.quiz_attempts?.length > 0 : false,
        };
      })
    );

    const currentPage = query?.pagination?.page ?? 1;
    const itemsPerPage = query?.pagination?.limit ?? 10;
    const totalPages = Math.ceil(count / itemsPerPage);

    return {
      data: dataWithGrade,
      meta:
        query?.pagination?.page && query?.pagination?.limit
          ? {
              totalItems: count,
              totalPages,
              currentPage,
              itemsPerPage,
            }
          : null,
    };
  }

  async getAllForStudent(user) {
    const rawData = await this.prisma.quiz.findMany({
      where: {
        status: "PUBLISH",
        end_date: {
          gt: new Date(), // Menampilkan quiz yang belum expired
        },
        course: {
          course_enrollments: {
            some: {
              user_id: user.id,
              role: "MEMBER",
            },
          },
        },
        // HAPUS bagian 'quiz_attempts: { none... }' agar quiz yang sudah dikerjakan tetap muncul
      },
      include: {
        course: true,
        // 1. Ambil jumlah soal untuk pembagi rumus nilai
        _count: {
          select: {
            quiz_questions: true,
          },
        },
        // 2. Ambil attempt user ini untuk dihitung nilainya
        quiz_attempts: {
          where: {
            user_id: user.id, // Hanya attempt milik user yang sedang login
          },
          include: {
            quiz_attempt_question_answers: {
              include: {
                quiz_option_answer: true, // Untuk cek is_correct
              },
            },
          },
        },
      },
      orderBy: {
        end_date: "asc",
      },
    });

    // 3. Mapping data untuk menghitung Highest Grade
    const dataWithGrade = rawData.map((quiz) => {
      const totalQuestions = quiz._count.quiz_questions || 0;
      let highestGrade = null; // Default null jika belum pernah dikerjakan

      // Jika user sudah pernah mencoba (attempt > 0)
      if (quiz.quiz_attempts.length > 0 && totalQuestions > 0) {
        // Hitung nilai untuk SETIAP attempt
        const grades = quiz.quiz_attempts.map((attempt) => {
          const correctCount = attempt.quiz_attempt_question_answers.filter(
            (ans) => ans.quiz_option_answer?.is_correct === true
          ).length;

          return (correctCount / totalQuestions) * 100;
        });

        // Ambil nilai tertinggi dari array grades
        const maxScore = Math.max(...grades);
        highestGrade = parseFloat(maxScore.toFixed(2));
      }

      // Opsional: Bersihkan object agar tidak terlalu berat (menghapus detail attempt)
      // const { quiz_attempts, ...rest } = quiz;

      return {
        ...quiz, // atau ...rest
        total_questions: totalQuestions,
        highest_grade: highestGrade, // Field baru: Nilai Tertinggi
        is_attempted: quiz.quiz_attempts.length > 0, // Info apakah sudah pernah dikerjakan
      };
    });

    return {
      data: dataWithGrade,
      meta: null,
    };
  }

  async getById(id) {
    const data = await this.prisma.Quiz.findFirst({
      where: { id },
      include: {
        course: true,
        quiz_questions: {
          include: {
            quiz_option_answers: true,
          },
        },
      },
    });

    if (!data) throw BaseError.notFound("Quiz not found.");

    return data;
  }

  async create(value, user) {
    if (value.course_id) {
      const courseExists = await this.prisma.Course.findUnique({
        where: { id: value.course_id },
      });

      if (!courseExists) {
        throw new Joi.ValidationError("Course not found", [
          {
            message: "Course not found",
            path: ["course_id"],
          },
        ]);
      }
    }

    if (value.type === QuizType.PUBLISH) {
      if (!value.start_date || !value.end_date) {
        throw new Joi.ValidationError(
          "Published quiz must have start and end date",
          [
            {
              message:
                "Start date and end date are required for published quiz",
              path: ["start_date", "end_date"],
            },
          ]
        );
      }
    }

    const data = await this.prisma.Quiz.create({
      data: {
        title: value.title,
        description: value.description,
        status: value.status,
        type: value.type,
        show_review: value.show_review,
        max_attempt: value.max_attempt,
        duration: value.duration,
        start_date: value.start_date,
        end_date: value.end_date,
        course_id: value.course_id,
      },
      include: {
        course: true,
      },
    });

    // update
    if (value.end_date && value.course_id) {
      try {
        const referenceDate = new Date(value.end_date);

        const endTime = new Date(referenceDate);
        const startTime = new Date(referenceDate);
        startTime.setHours(0, 0, 0, 0);

        const schedulePayload = {
          title: `Due: ${value.title}`,
          description: `Deadline for Quiz: ${value.title}`,
          course_id: value.course_id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
        };

        await ScheduleService.create(schedulePayload, user);
      } catch (error) {
        console.error(
          "[WARN] Failed to auto-create schedule for quiz:",
          error.message
        );
      }
    }

    return data;
  }

  async update(id, value, user) {
    const quiz = await this.prisma.Quiz.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!quiz) throw BaseError.notFound("Quiz not found.");

    if (value.course_id) {
      const courseExists = await this.prisma.Course.findUnique({
        where: { id: value.course_id },
      });

      if (!courseExists) {
        throw new Joi.ValidationError("Course not found", [
          {
            message: "Course not found",
            path: ["course_id"],
          },
        ]);
      }
    }

    if (value.type === QuizType.PUBLISH) {
      if (
        (!quiz.start_date && !value.start_date) ||
        (!quiz.end_date && !value.end_date)
      ) {
        throw new Joi.ValidationError(
          "Published quiz must have start and end date",
          [
            {
              message:
                "Start date and end date are required for published quiz",
              path: ["start_date", "end_date"],
            },
          ]
        );
      }
    }

    const updatedQuiz = await this.prisma.Quiz.update({
      where: { id },
      data: value,
      include: {
        course: true,
      },
    });

    return updatedQuiz;
  }

  async delete(id, user) {
    const quiz = await this.prisma.Quiz.findUnique({
      where: { id },
      include: {
        course: true,
      },
    });

    if (!quiz) throw BaseError.notFound("Quiz not found.");

    const deletedQuiz = await this.prisma.Quiz.delete({
      where: { id },
    });

    return {
      data: deletedQuiz,
      message: "Quiz deleted successfully.",
    };
  }
}

export default new QuizService();
