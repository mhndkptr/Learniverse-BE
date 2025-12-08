import { PrismaService } from "../../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../../utils/buildQueryOptions.js";
import BaseError from "../../../../base-classes/base-error.js";
import quizOptionAnswerQueryConfig from "./quiz-option-answer-query-config.js";

class QuizOptionAnswerService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(quizOptionAnswerQueryConfig, query);

    if (query.advSearch?.quiz_question_id) {
      if (!options.where) options.where = {};
      options.where.quiz_question_id = query.advSearch.quiz_question_id;
    }

    const [data, count] = await Promise.all([
      this.prisma.QuizOptionAnswer.findMany({ ...options }),
      this.prisma.QuizOptionAnswer.count({ where: options.where }),
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
    const data = await this.prisma.QuizOptionAnswer.findFirst({
      where: { id },
      include: {
        quiz_question: true,
        quiz_attempt_question_answers: true,
      },
    });

    if (!data) throw BaseError.notFound("Quiz option answer not found.");

    return data;
  }

  async create(value, user) {
    const parent = await this.prisma.QuizQuestion.findUnique({ where: { id: value.quiz_question_id } });
    if (!parent) {
      throw BaseError.notFound("Parent quiz question not found.");
    }

    const created = await this.prisma.QuizOptionAnswer.create({
      data: {
        answer: value.answer,
        image_uri: value.image_uri || null,
        is_correct: !!value.is_correct,
        quiz_question_id: value.quiz_question_id,
      },
    });

    return created;
  }

  async update(id, value, user) {
    const existing = await this.prisma.QuizOptionAnswer.findUnique({ where: { id } });
    if (!existing) throw BaseError.notFound("Quiz option answer not found.");

    const updated = await this.prisma.QuizOptionAnswer.update({
      where: { id },
      data: {
        answer: value.answer,
        image_uri: value.image_uri === undefined ? existing.image_uri : value.image_uri,
        is_correct: value.is_correct === undefined ? existing.is_correct : !!value.is_correct,
      },
    });

    return updated;
  }

  async delete(id, user) {
    const existing = await this.prisma.QuizOptionAnswer.findUnique({ where: { id } });
    if (!existing) throw BaseError.notFound("Quiz option answer not found.");

    const deleted = await this.prisma.QuizOptionAnswer.delete({ where: { id } });

    return {
      data: deleted,
      message: "Quiz option answer deleted successfully.",
    };
  }
}

export default new QuizOptionAnswerService();