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
      if (!options.where) {
        options.where = {};
      }
      options.where.quiz_id = query.advSearch.quiz_id;
    }

    if (query.advSearch?.user_id) {
      if (!options.where) {
        options.where = {};
      }
      options.where.user_id = query.advSearch.user_id;
    }

    const [data, count] = await Promise.all([
      this.prisma.QuizAttempt.findMany({
        ...options,
      }),
      this.prisma.QuizAttempt.count({
        where: options.where,
      }),
    ]);

    const currentPage = query?.pagination?.page ?? 1;
    const itemsPerPage = query?.pagination?.limit ?? 10;
    const totalPages = Math.ceil(count / itemsPerPage);

    return {
      data,
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
      throw new Joi.ValidationError("Quiz not found", [{
        message: "Quiz not found",
        path: ["quiz_id"],
      }]);
    }

    const userExists = await this.prisma.User.findUnique({
      where: { id: user.id },
    });

    if (!userExists) {
      throw new Joi.ValidationError("User not found", [{
        message: "User not found",
        path: ["user_id"],
      }]);
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

    if (!value.start_at) {
      throw new Joi.ValidationError("Start date is required.", [{
        message: "Start date is required.",
        path: ["start_at"],
      }]);
    }

    if (!value.finish_at) {
      throw new Joi.ValidationError("Finish date is required.", [{
        message: "Finish date is required.",
        path: ["finish_at"],
      }]);
    }

    if (new Date(value.finish_at) < new Date(value.start_at)) {
      throw new Joi.ValidationError("Finish date must be after start date", [{
        message: "Finish date must be after start date",
        path: ["finish_at"],
      }]);
    }

    const data = await this.prisma.QuizAttempt.create({
      data: {
        quiz_id: value.quiz_id,
        user_id: user.id,
        status: value.status || QuizAttemptStatus.ON_PROGRESS,
        start_at: value.start_at,
        finish_at: value.finish_at,
        quiz_attempt_question_answers: {
          create: value.quiz_attempt_question_answers?.map((answer) => ({
            quiz_question_id: answer.quiz_question_id,
            quiz_option_answer_id: answer.quiz_option_answer_id,
          })) || [],
        },
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
        throw new Joi.ValidationError("Finish date must be after start date", [{
          message: "Finish date must be after start date",
          path: ["finish_at"],
        }]);
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