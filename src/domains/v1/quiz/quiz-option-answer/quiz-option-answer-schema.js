import Joi from "joi";

const getAllQuizOptionAnswerParamsSchema = Joi.object({
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
        field: Joi.string().valid("created_at", "updated_at", "is_correct", "answer").required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  advSearch: Joi.object({
    quiz_question_id: Joi.string().uuid().optional(),
    is_correct: Joi.boolean().optional(),
  }).optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("quiz_question", "quiz_attempt_question_answers"))
    .optional(),

  filter: Joi.object({
    quiz_question_id: Joi.string().uuid().optional(),
    is_correct: Joi.boolean().optional(),
    answer: Joi.string().optional(),
  }).optional(),
});

const createQuizOptionAnswerSchema = Joi.object({
  quiz_question_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz question ID is required.",
    "string.uuid": "Quiz question ID must be a valid UUID.",
    "any.required": "Quiz question ID is required.",
  }),

  answer: Joi.string().required().messages({
    "string.empty": "Answer text is required.",
    "any.required": "Answer text is required.",
  }),

  image_uri: Joi.string().uri().optional(),

  is_correct: Joi.boolean().required().messages({
    "any.required": "is_correct flag is required.",
  }),
});

const updateQuizOptionAnswerSchema = Joi.object({
  answer: Joi.string().optional(),
  image_uri: Joi.string().uri().allow(null).optional(),
  is_correct: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to perform an update.",
  });

const getQuizOptionAnswerByIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz option answer ID is required.",
    "string.uuid": "Quiz option answer ID must be a valid UUID.",
    "any.required": "Quiz option answer ID is required.",
  }),
});

const deleteQuizOptionAnswerSchema = Joi.object({
  force: Joi.boolean().optional(),
});

export {
  getAllQuizOptionAnswerParamsSchema,
  createQuizOptionAnswerSchema,
  updateQuizOptionAnswerSchema,
  getQuizOptionAnswerByIdSchema,
  deleteQuizOptionAnswerSchema,
};
