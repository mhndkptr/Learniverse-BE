import Joi from "joi";
import { PrismaService } from "../../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../../utils/buildQueryOptions.js";
import BaseError from "../../../../base-classes/base-error.js";
import quizQuestionQueryConfig from "./quiz-question-query-config.js";

class QuizQuestionService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(quizQuestionQueryConfig, query);

    if (query.advSearch?.quiz_id) {
      if (!options.where) {
        options.where = {};
      }
      options.where.quiz_id = query.advSearch.quiz_id;
    }

    const [data, count] = await Promise.all([
      this.prisma.QuizQuestion.findMany({
        ...options,
      }),
      this.prisma.QuizQuestion.count({
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
    const data = await this.prisma.QuizQuestion.findFirst({
      where: { id },
      include: {
        quiz: {
          include: {
            course: true,
          },
        },
        quiz_option_answers: true,
        quiz_attempt_question_answers: true,
      },
    });

    if (!data) throw BaseError.notFound("Quiz question not found.");

    return data;
  }

  async create(value, user) {
    // validate parent quiz exists
    const quizExists = await this.prisma.Quiz.findUnique({
      where: { id: value.quiz_id },
    });
    if (!quizExists) {
      throw new Joi.ValidationError("Quiz not found", [
        { message: "Quiz not found", path: ["quiz_id"] },
      ]);
    }

    // Use a transaction for create to be explicit and consistent
    const data = await this.prisma.$transaction(async (tx) => {
      const created = await tx.quizQuestion.create({
        data: {
          question: value.question,
          type: value.type,
          image_uri: value.image_uri || null,
          quiz_id: value.quiz_id,
          quiz_option_answers: value.quiz_option_answers
            ? {
                create: value.quiz_option_answers.map((opt) => ({
                  answer: opt.answer,
                  image_uri: opt.image_uri || null,
                  is_correct: !!opt.is_correct,
                })),
              }
            : undefined,
        },
        include: {
          quiz_option_answers: true,
        },
      });

      return created;
    });

    return data;
  }

  async update(id, value, user) {
    const quizQuestion = await this.prisma.quizQuestion.findUnique({
      where: { id },
      include: { quiz_option_answers: true },
    });

    if (!quizQuestion) throw BaseError.notFound("Quiz question not found.");

    // perform update and option answers replacement in a transaction
    const updated = await this.prisma.$transaction(async (tx) => {
      if (value.quiz_option_answers) {
        await tx.QuizOptionAnswer.deleteMany({
          where: { quiz_question_id: id },
        });
        // use createMany without client-supplied id so prisma generates ids
        await tx.QuizOptionAnswer.createMany({
          data: value.quiz_option_answers.map((opt) => ({
            answer: opt.answer,
            image_uri: opt.image_uri || null,
            is_correct: !!opt.is_correct,
            quiz_question_id: id,
          })),
        });
      }

      const upd = await tx.quizQuestion.update({
        where: { id },
        data: {
          question: value.question,
          type: value.type,
          image_uri: value.image_uri,
        },
        include: {
          quiz_option_answers: true,
        },
      });

      return upd;
    });

    return updated;
  }

  async delete(id, user) {
    const quizQuestion = await this.prisma.quizQuestion.findUnique({
      where: { id },
    });

    if (!quizQuestion) throw BaseError.notFound("Quiz question not found.");

    const deleted = await this.prisma.quizQuestion.delete({ where: { id } });
    return {
      data: deleted,
      message: "Quiz question deleted successfully.",
    };
  }
}

export default new QuizQuestionService();
