import { PrismaService } from "../../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../../utils/buildQueryOptions.js";
import BaseError from "../../../../base-classes/base-error.js";
import quizAttemptQuestionAnswerQueryConfig from "./quiz-attempt-question-answer-query-config.js";

class QuizAttemptQuestionAnswerService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(quizAttemptQuestionAnswerQueryConfig, query);

    if (query.advSearch?.quiz_attempt_id) {
      if (!options.where) options.where = {};
      options.where.quiz_attempt_id = query.advSearch.quiz_attempt_id;
    }

    if (query.advSearch?.quiz_question_id) {
      if (!options.where) options.where = {};
      options.where.quiz_question_id = query.advSearch.quiz_question_id;
    }

    const [data, count] = await Promise.all([
      this.prisma.QuizAttemptQuestionAnswer.findMany({ ...options }),
      this.prisma.QuizAttemptQuestionAnswer.count({ where: options.where }),
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
    const data = await this.prisma.QuizAttemptQuestionAnswer.findFirst({
      where: { id },
      include: {
        quiz_attempt: true,
        quiz_question: true,
        quiz_option_answer: true,
      },
    });

    if (!data) throw BaseError.notFound("Quiz attempt question answer not found.");

    return data;
  }

  async create(value, user) {
    const parentAttempt = await this.prisma.QuizAttempt.findUnique({
      where: { id: value.quiz_attempt_id },
    });
    if (!parentAttempt) {
      throw BaseError.notFound("Parent quiz attempt not found.");
    }

    const created = await this.prisma.QuizAttemptQuestionAnswer.create({
      data: {
        quiz_attempt_id: value.quiz_attempt_id,
        quiz_question_id: value.quiz_question_id,
        quiz_option_answer_id: value.quiz_option_answer_id,
      },
    });

    return created;
  }

  async update(id, value, user) {
    const existing = await this.prisma.QuizAttemptQuestionAnswer.findUnique({
      where: { id },
    });
    if (!existing) throw BaseError.notFound("Quiz attempt question answer not found.");

    const updated = await this.prisma.QuizAttemptQuestionAnswer.update({
      where: { id },
      data: {
        quiz_option_answer_id:
          value.quiz_option_answer_id === undefined
            ? existing.quiz_option_answer_id
            : value.quiz_option_answer_id,
      },
    });

    return updated;
  }

  async delete(id, user) {
    const existing = await this.prisma.QuizAttemptQuestionAnswer.findUnique({
      where: { id },
    });
    if (!existing) throw BaseError.notFound("Quiz attempt question answer not found.");

    const deleted = await this.prisma.QuizAttemptQuestionAnswer.delete({
      where: { id },
    });

    return {
      data: deleted,
      message: "Quiz attempt question answer deleted successfully.",
    };
  }
}

export default new QuizAttemptQuestionAnswerService();