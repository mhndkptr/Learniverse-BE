import Joi from "joi";

const getAllQuizAttemptQuestionAnswerParamsSchema = Joi.object({
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
        field: Joi.string().valid("created_at", "updated_at").required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  advSearch: Joi.object({
    quiz_attempt_id: Joi.string().uuid().optional(),
    quiz_question_id: Joi.string().uuid().optional(),
    quiz_option_answer_id: Joi.string().uuid().optional(),
  }).optional(),

  include_relation: Joi.array()
    .items(
      Joi.string().valid(
        "quiz_attempt",
        "quiz_question",
        "quiz_option_answer"
      )
    )
    .optional(),

  filter: Joi.object({
    quiz_attempt_id: Joi.string().uuid().optional(),
    quiz_question_id: Joi.string().uuid().optional(),
    quiz_option_answer_id: Joi.string().uuid().optional(),
  }).optional(),
});

const createQuizAttemptQuestionAnswerSchema = Joi.object({
  quiz_attempt_id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz attempt ID is required.",
    "string.uuid": "Quiz attempt ID must be a valid UUID.",
    "any.required": "Quiz attempt ID is required.",
  }),

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

const updateQuizAttemptQuestionAnswerSchema = Joi.object({
  // Biasanya user hanya mengubah jawaban yang dipilih
  quiz_option_answer_id: Joi.string().uuid().optional().messages({
    "string.uuid": "Quiz option answer ID must be a valid UUID.",
  }),
  // Jarang terjadi attempt_id atau question_id berubah setelah record dibuat,
  // tapi jika diperlukan, bisa ditambahkan di sini.
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to perform an update.",
  });

const getQuizAttemptQuestionAnswerByIdSchema = Joi.object({
  id: Joi.string().uuid().required().messages({
    "string.empty": "Quiz attempt question answer ID is required.",
    "string.uuid": "Quiz attempt question answer ID must be a valid UUID.",
    "any.required": "Quiz attempt question answer ID is required.",
  }),
});

const deleteQuizAttemptQuestionAnswerSchema = Joi.object({
  force: Joi.boolean().optional(),
});

export {
  getAllQuizAttemptQuestionAnswerParamsSchema,
  createQuizAttemptQuestionAnswerSchema,
  updateQuizAttemptQuestionAnswerSchema,
  getQuizAttemptQuestionAnswerByIdSchema,
  deleteQuizAttemptQuestionAnswerSchema,
};