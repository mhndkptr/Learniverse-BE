import Joi from "joi";
import { PrismaService } from "../../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../../utils/buildQueryOptions.js";
import BaseError from "../../../../base-classes/base-error.js";
import QuizAttemptStatus from "../../../../common/enums/quiz-attempt-status-enum.js";
import quizAttemptQueryConfig from "./quiz-attempt-query-config.js";

class QuizAttemptService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(quizAttemptQueryConfig, query);

    if (query.advSearch?.quiz_id) {
      if (!options.where) options.where = {};
      options.where.quiz_id = query.advSearch.quiz_id;
    }

    if (query.advSearch?.user_id) {
      if (!options.where) options.where = {};
      options.where.user_id = query.advSearch.user_id;
    }

    // --- PERBAIKAN 1: Update Include ---
    // Kita butuh data lengkap soal & opsi (dari Quiz) untuk membuat "Kunci Jawaban"
    // Dan data jawaban user (dari Attempt) untuk dicocokkan.
    options.include = {
      ...options.include,
      user: true,
      quiz: {
        include: {
          // Ambil daftar soal dan opsi jawaban benar untuk Kunci Jawaban
          quiz_questions: {
            include: {
              quiz_option_answers: true,
            },
          },
        },
      },
      // Ambil jawaban yang dipilih user
      quiz_attempt_question_answers: true,
    };

    const [rawData, count] = await Promise.all([
      this.prisma.QuizAttempt.findMany({
        ...options,
      }),
      this.prisma.QuizAttempt.count({
        where: options.where,
      }),
    ]);

    // --- PERBAIKAN 2: Logika Penilaian Strict (Exact Match) ---
    const dataWithGrade = rawData.map((attempt) => {
      // Guard clause jika data quiz hilang/terhapus
      if (!attempt.quiz || !attempt.quiz.quiz_questions) {
        return { ...attempt, grade: 0, total_correct: 0, total_questions: 0 };
      }

      const questions = attempt.quiz.quiz_questions;
      const totalQuestions = questions.length;

      // A. Grouping Jawaban User: { "question_id": ["opt_id_1", "opt_id_2"] }
      const userAnswersMap = {};
      (attempt.quiz_attempt_question_answers || []).forEach((ans) => {
        if (!userAnswersMap[ans.quiz_question_id]) {
          userAnswersMap[ans.quiz_question_id] = [];
        }
        userAnswersMap[ans.quiz_question_id].push(ans.quiz_option_answer_id);
      });

      // B. Loop setiap soal untuk cek Benar/Salah
      let correctQuestionsCount = 0;

      questions.forEach((question) => {
        // 1. Ambil Kunci Jawaban (Array ID opsi yang benar)
        const correctOptionIds = question.quiz_option_answers
          .filter((opt) => opt.is_correct)
          .map((opt) => opt.id);

        // 2. Ambil Jawaban User untuk soal ini (Array ID)
        const userSelectedIds = userAnswersMap[question.id] || [];

        // 3. Bandingkan (Exact Match)
        // Harus memiliki jumlah yang sama DAN semua ID benar ada di pilihan user
        const isCorrect =
          correctOptionIds.length === userSelectedIds.length &&
          correctOptionIds.every((id) => userSelectedIds.includes(id));

        if (isCorrect) {
          correctQuestionsCount++;
        }
      });

      // C. Hitung Grade Akhir
      let grade = 0;
      if (totalQuestions > 0) {
        grade = (correctQuestionsCount / totalQuestions) * 100;
      }

      // D. Cleanup Object (Hapus data berat agar response ringan)
      // Kita hapus detail soal (quiz_questions) dari object 'quiz' karena tidak perlu ditampilkan di list attempt
      const quizSummary = {
        title: attempt.quiz.title,
        // Data lain dari quiz yang ingin dipertahankan
      };

      const { quiz, quiz_attempt_question_answers, ...rest } = attempt;

      return {
        ...rest,
        quiz: quizSummary, // Return quiz tanpa nested questions yang berat
        total_correct: correctQuestionsCount,
        total_questions: totalQuestions,
        grade: parseFloat(grade.toFixed(2)),
      };
    });

    // 5. PAGINATION RESPONSE
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

  async getById(id) {
    const data = await this.prisma.QuizAttempt.findFirst({
      where: { id },
      include: {
        quiz: {
          include: {
            course: true,
            quiz_questions: {
              include: {
                quiz_option_answers: true,
              },
            },
          },
        },
        user: true,
        quiz_attempt_question_answers: {
          include: {
            quiz_question: {
              include: {
                quiz_option_answers: true,
              },
            },
            quiz_option_answer: true,
          },
        },
      },
    });

    if (!data) throw BaseError.notFound("Quiz attempt not found.");

    return data;
  }

  async create(value, user) {
    const quizExists = await this.prisma.Quiz.findUnique({
      where: { id: value.quiz_id },
    });

    if (!quizExists) {
      throw new Joi.ValidationError("Quiz not found", [
        {
          message: "Quiz not found",
          path: ["quiz_id"],
        },
      ]);
    }

    if (quizExists?.status !== "PUBLISH") {
      throw BaseError.badRequest(
        "Cannot attempt a quiz that is not published."
      );
    }

    if (quizExists?.end_date && new Date(quizExists.end_date) < new Date()) {
      throw BaseError.badRequest("Cannot attempt a quiz that has ended.");
    }

    const userExists = await this.prisma.User.findUnique({
      where: { id: user.id },
    });

    if (!userExists) {
      throw new Joi.ValidationError("User not found", [
        {
          message: "User not found",
          path: ["user_id"],
        },
      ]);
    }

    const attemptCount = await this.prisma.QuizAttempt.count({
      where: {
        quiz_id: value.quiz_id,
        user_id: user.id,
      },
    });

    if (attemptCount >= quizExists.max_attempt) {
      throw BaseError.badRequest(
        `Maximum attempt (${quizExists.max_attempt}) reached for this quiz`
      );
    }

    const questionCount = await this.prisma.QuizQuestion.count({
      where: { quiz_id: value.quiz_id },
    });

    if (questionCount === 0) {
      throw BaseError.badRequest(
        "Cannot attempt a quiz with no questions available."
      );
    }

    const data = await this.prisma.QuizAttempt.create({
      data: {
        quiz: {
          connect: { id: value.quiz_id },
        },
        user: {
          connect: { id: user.id },
        },
        status: QuizAttemptStatus.ON_PROGRESS,
        start_at: new Date(),
        finish_at: null,
      },
      include: {
        quiz: {
          include: {
            course: true,
            quiz_questions: {
              include: {
                quiz_option_answers: true,
              },
            },
          },
        },
        user: true,
        quiz_attempt_question_answers: {
          include: {
            quiz_question: {
              include: {
                quiz_option_answers: true,
              },
            },
            quiz_option_answer: true,
          },
        },
      },
    });

    return data;
  }

  async update(id, value, user) {
    const quizAttempt = await this.prisma.QuizAttempt.findUnique({
      where: { id },
      include: {
        quiz_attempt_question_answers: true,
      },
    });

    if (!quizAttempt) throw BaseError.notFound("Quiz attempt not found.");

    if (value.status) {
      if (
        quizAttempt.status === QuizAttemptStatus.FINISHED &&
        value.status === QuizAttemptStatus.ON_PROGRESS
      ) {
        throw BaseError.badRequest(
          "Cannot change status from FINISHED to ON_PROGRESS"
        );
      }
    }

    if (value.finish_at) {
      if (new Date(value.finish_at) < new Date(quizAttempt.start_at)) {
        throw new Joi.ValidationError("Finish date must be after start date", [
          {
            message: "Finish date must be after start date",
            path: ["finish_at"],
          },
        ]);
      }
    }

    if (value.quiz_attempt_question_answers) {
      await this.prisma.QuizAttemptQuestionAnswer.deleteMany({
        where: { quiz_attempt_id: id },
      });

      await this.prisma.QuizAttemptQuestionAnswer.createMany({
        data: value.quiz_attempt_question_answers.map((answer) => ({
          quiz_attempt_id: id,
          quiz_question_id: answer.quiz_question_id,
          quiz_option_answer_id: answer.quiz_option_answer_id,
        })),
      });
    }

    const updatedQuizAttempt = await this.prisma.QuizAttempt.update({
      where: { id },
      data: {
        status: value.status,
        finish_at: value.finish_at,
      },
      include: {
        quiz: {
          include: {
            course: true,
            quiz_questions: {
              include: {
                quiz_option_answers: true,
              },
            },
          },
        },
        user: true,
        quiz_attempt_question_answers: {
          include: {
            quiz_question: {
              include: {
                quiz_option_answers: true,
              },
            },
            quiz_option_answer: true,
          },
        },
      },
    });

    return updatedQuizAttempt;
  }

  async delete(id, user) {
    const quizAttempt = await this.prisma.QuizAttempt.findUnique({
      where: { id },
    });

    if (!quizAttempt) throw BaseError.notFound("Quiz attempt not found.");

    const deletedQuizAttempt = await this.prisma.QuizAttempt.delete({
      where: { id },
    });

    return {
      data: deletedQuizAttempt,
      message: "Quiz attempt deleted successfully.",
    };
  }
}

export default new QuizAttemptService();
