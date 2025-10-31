import Joi from "joi";
import QuizType from "../../../common/enums/quiz-enum.js";

const getAllQuizParamsSchema = Joi.object({
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
          .valid("title", "identifier", "type", "start_time", "created_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  advSearch: Joi.object({
    conference_schedule_id: Joi.string().uuid().optional(),
  }).optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("course", "quiz"))
    .optional(),

  filter: Joi.object({
    type: Joi.string()
      .valid(...Object.values(QuizType))
      .optional(),
    schedule_id: Joi.string().uuid().optional(),
    Quiz_id: Joi.string().uuid().optional(),
  }),
});

const QuizSchema = Joi.object({
  title: Joi.string().min(3).required().messages({
    "string.empty": "Quiz title is required.",
    "string.min": "Quiz title must be at least 3 characters long.",
  }),
  description: Joi.string().allow(null, ""),
  status: Joi.string().valid("PUBLISH", "DRAFT").optional(),
  show_review: Joi.boolean().optional(),
  max_attempt: Joi.number().integer().min(1).optional(),
  duration: Joi.number().integer().min(0).optional(),
  course_id: Joi.string().uuid().optional(),
});

const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Quiz title is required.",
    "string.min": "Quiz title must be at least 3 characters long.",
    "string.max": "Quiz title cannot exceed 100 characters.",
  }),

  identifier: Joi.string().allow(null, ""),

  description: Joi.string().allow(null, ""),

  type: Joi.string()
    .valid(QuizType.MAIN, QuizType.PARALLEL)
    .required()
    .messages({
      "any.only": `Type must be one of: ${Object.values(QuizType).join(", ")}`,
      "string.empty": "Quiz type is required.",
      "any.required": "Quiz type is required.",
    }),

  start_date: Joi.date().iso().required().messages({
    "any.required": "Start date is required.",
    "date.format": "Start date must be in ISO 8601 format.",
  }),

  end_date: Joi.date().iso().required().messages({
    "any.required": "End date is required.", 
    "date.format": "End date must be in ISO 8601 format.",
  }),

  Quiz: Joi.any()
    .when("type", {
      is: QuizType.PUBLISH,
      then: Joi.forbidden().messages({
        "any.forbidden": "Quiz object is not allowed when type is PUBLISH",
      }),
    })
    .when("type", {
      is: QuizType.DRAFT,
      then: QuizSchema.required().messages({
        "any.required": "Quiz object is required when type is DRAFT",
      }),
    }),

  status: Joi.string().valid("PUBLISH", "DRAFT").optional(),
  show_review: Joi.boolean().optional(),
  max_attempt: Joi.number().integer().min(1).optional(),
  duration: Joi.number().integer().min(0).optional(),
  course_id: Joi.string().uuid().optional(),

});

const updateQuizSchema = Joi.object({
  title: Joi.string().min(3).max(100).messages({
    "string.min": "Quiz title must be at least 3 characters long.",
    "string.max": "Quiz title cannot exceed 100 characters.",
  }),

  identifier: Joi.string().allow(null, ""),

  description: Joi.string().allow(null, ""),

  type: Joi.string()
    .valid(QuizType.PUBLISH, QuizType.DRAFT)
    .messages({
      "any.only": `Type must be one of: ${Object.values(QuizType).join(", ")}`,
    }),

  start_date: Joi.date().iso().messages({
    "date.format": "Start date must be in ISO 8601 format.",
  }),

  end_date: Joi.date().iso().messages({
    "date.format": "End date must be in ISO 8601 format.",
  }),

  Quiz: Joi.any()
    .when("type", {
      is: QuizType.PUBLISH,
      then: Joi.forbidden().messages({
        "any.forbidden": "Quiz object is not allowed when type is PUBLISH",
      }),
    })
    .when("type", {
      is: QuizType.DRAFT,
      then: QuizSchema.required().messages({
        "any.required": "Quiz object is required when type is DRAFT",
      }),
    })
    .when("type", {
      is: Joi.not(Joi.exist()),
      then: Joi.optional(),
    }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to perform an update.",
  });

const deleteQuizSchema = Joi.object({
  force: Joi.boolean().optional(),
});

export { createQuizSchema, updateQuizSchema, getAllQuizParamsSchema, deleteQuizSchema};