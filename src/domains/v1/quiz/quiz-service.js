import Joi from "joi";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import BaseError from "../../../base-classes/base-error.js";
import QuizType from "../../../common/enums/quiz-enum.js";
import quizQueryConfig from "./quiz-query-config.js";
import ScheduleService from "../schedule/schedule-service.js";

class QuizService {
  constructor() {
    this.prisma = new PrismaService();
  }

  async getAll(query) {
    const options = buildQueryOptions(quizQueryConfig, query);

    if (query.advSearch?.quiz_id) {
      if (!options.where) {
        options.where = {};
      }

      options.where.quiz = {
        ...options.where.quiz,
        quiz_id: query.advSearch.quiz_id,
      };
    }

    const [data, count] = await Promise.all([
      this.prisma.Quiz.findMany({
        ...options,
        include: {
          course: true,
        },
      }),
      this.prisma.Quiz.count({
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

        // Set Start Time
        const startTime = new Date(referenceDate);
        startTime.setHours(0, 0, 0, 0);

        // Set End Time
        const endTime = referenceDate;

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
