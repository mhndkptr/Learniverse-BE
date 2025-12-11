import Joi from "joi";
import QuizAttemptStatus from "../../../../common/enums/quiz-attempt-status-enum.js";

const getAllQuizAttemptParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(true),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }).when("get_all", {
    is: false,
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid("status", "start_at", "finish_at", "created_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  advSearch: Joi.object({
    quiz_id: Joi.string().uuid().optional(),
    user_id: Joi.string().uuid().optional(),
  }).optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("quiz", "user", "quiz_attempt_question_answers"))
    .optional(),

  filter: Joi.object({
    status: Joi.string()
      .valid(...Object.values(QuizAttemptStatus))
      .optional(),
    quiz_id: Joi.string().uuid().optional(),
    user_id: Joi.string().uuid().optional(),
  }).optional(),
});

const QuizAttemptAnswerSchema = Joi.object({
  quiz_question_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz question ID is required.",
    "string.uuid": "Quiz question ID must be a valid UUID.",
    "any.required": "Quiz question ID is required.",
  }),

  quiz_option_answer_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz option answer ID is required.",
    "string.uuid": "Quiz option answer ID must be a valid UUID.",
    "any.required": "Quiz option answer ID is required.",
  }),
});

const createQuizAttemptSchema = Joi.object({
  quiz_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz ID is required.",
    "string.uuid": "Quiz ID must be a valid UUID.",
    "any.required": "Quiz ID is required.",
  }),

  status: Joi.string()
    .valid(...Object.values(QuizAttemptStatus))
    .default("ON_PROGRESS")
    .messages({
      "any.only": `Status must be one of: ${Object.values(QuizAttemptStatus).join(", ")}`,
    }),

  start_at: Joi.date().iso().required().messages({
    "any.required": "Start date is required.",
    "date.format": "Start date must be in ISO 8601 format.",
  }),

  finish_at: Joi.date().iso().required().messages({
    "any.required": "Finish date is required.",
    "date.format": "Finish date must be in ISO 8601 format.",
  }),

  quiz_attempt_question_answers: Joi.array()
    .items(QuizAttemptAnswerSchema)
    .optional(),
});

const updateQuizAttemptSchema = Joi.object({
  status: Joi.string()
    .valid(...Object.values(QuizAttemptStatus))
    .messages({
      "any.only": `Status must be one of: ${Object.values(QuizAttemptStatus).join(", ")}`,
    }),

  finish_at: Joi.date().iso().messages({
    "date.format": "Finish date must be in ISO 8601 format.",
  }),

  quiz_attempt_question_answers: Joi.array()
    .items(QuizAttemptAnswerSchema)
    .optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to perform an update.",
  });

const deleteQuizAttemptSchema = Joi.object({
  force: Joi.boolean().optional(),
});

export {
  createQuizAttemptSchema,
  updateQuizAttemptSchema,
  getAllQuizAttemptParamsSchema,
  deleteQuizAttemptSchema,
  QuizAttemptAnswerSchema,
};