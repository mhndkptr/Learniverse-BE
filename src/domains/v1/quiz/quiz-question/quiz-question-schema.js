import Joi from "joi";
import QuizQuestionType from "../../../../common/enums/quiz-question-type-enum.js";

const getAllQuizQuestionParamsSchema = Joi.object({
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
          .valid("created_at", "updated_at", "type", "question")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  advSearch: Joi.object({
    quiz_id: Joi.string().uuid().optional(),
    question: Joi.string().optional(),
    type: Joi.string().valid(...Object.values(QuizQuestionType)).optional(),
  }).optional(),

  include_relation: Joi.array()
    .items(
      Joi.string().valid(
        "quiz",
        "quiz_option_answers",
        "quiz_attempt_question_answers"
      )
    )
    .optional(),

  filter: Joi.object({
    quiz_id: Joi.string().uuid().optional(),
    type: Joi.string().valid(...Object.values(QuizQuestionType)).optional(),
    question: Joi.string().optional(),
  }).optional(),
});

const QuizOptionAnswerSchema = Joi.object({
  answer: Joi.string().required().messages({
    "string.empty": "Answer text is required.",
    "any.required": "Answer text is required.",
  }),

  image_uri: Joi.string().uri().optional(),

  is_correct: Joi.boolean().required().messages({
    "any.required": "is_correct flag is required for option answers.",
  }),
});

const createQuizQuestionSchema = Joi.object({
  quiz_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz ID is required.",
    "string.uuid": "Quiz ID must be a valid UUID.",
    "any.required": "Quiz ID is required.",
  }),

  question: Joi.string().required().messages({
    "string.empty": "Question text is required.",
    "any.required": "Question text is required.",
  }),

  type: Joi.string()
    .valid(...Object.values(QuizQuestionType))
    .required()
    .messages({
      "any.only": `Type must be one of: ${Object.values(QuizQuestionType).join(", ")}`,
      "any.required": "Question type is required.",
    }),

  image_uri: Joi.string().uri().optional(),

  quiz_option_answers: Joi.array().items(QuizOptionAnswerSchema).optional(),
});

const updateQuizQuestionSchema = Joi.object({
  question: Joi.string().optional(),

  type: Joi.string()
    .valid(...Object.values(QuizQuestionType))
    .optional()
    .messages({
      "any.only": `Type must be one of: ${Object.values(QuizQuestionType).join(", ")}`,
    }),

  image_uri: Joi.string().uri().allow(null).optional(),

  quiz_option_answers: Joi.array().items(QuizOptionAnswerSchema).optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to perform an update.",
  });

const getQuizQuestionByIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz question ID is required.",
    "string.uuid": "Quiz question ID must be a valid UUID.",
    "any.required": "Quiz question ID is required.",
  }),
});

const deleteQuizQuestionSchema = Joi.object({
  force: Joi.boolean().optional(),
});

export {
  createQuizQuestionSchema,
  updateQuizQuestionSchema,
  getAllQuizQuestionParamsSchema,
  getQuizQuestionByIdSchema,
  deleteQuizQuestionSchema,
  QuizOptionAnswerSchema,
};