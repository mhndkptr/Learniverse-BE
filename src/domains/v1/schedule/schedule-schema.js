import Joi from "joi";

const createScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.base": "Title must be a string.",
    "string.empty": "Title cannot be empty.",
    "string.min": "Title must be at least 3 characters long.",
    "string.max": "Title cannot exceed 100 characters.",
    "any.required": "Title is required.",
  }),

  description: Joi.string().allow("", null).optional().messages({
    "string.base": "Description must be a string.",
  }),

  start_time: Joi.date().required().messages({
    "date.base": "Start time must be a valid date.",
    "any.required": "Start time is required.",
  }),

  end_time: Joi.date().required().messages({
    "date.base": "End time must be a valid date.",
    "any.required": "End time is required.",
  }),

  course_id: Joi.string().uuid().required().messages({
    "string.base": "Course ID must be a string.",
    "string.uuid": "Course ID must be a valid UUID.",
    "any.required": "Course ID is required.",
  }),
});

const updateScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional().messages({
    "string.base": "Title must be a string.",
    "string.min": "Title must be at least 3 characters long.",
    "string.max": "Title cannot exceed 100 characters.",
  }),

  description: Joi.string().allow("", null).optional().messages({
    "string.base": "Description must be a string.",
  }),

  start_time: Joi.date().optional().messages({
    "date.base": "Start time must be a valid date.",
  }),

  end_time: Joi.date().optional().messages({
    "date.base": "End time must be a valid date.",
  }),

  course_id: Joi.string().uuid().optional().messages({
    "string.base": "Course ID must be a string.",
    "string.uuid": "Course ID must be a valid UUID.",
  }),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided to update.",
  });

const getAllScheduleParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(false),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1).messages({
      "number.base": "Page must be a number.",
      "number.min": "Page must be at least 1.",
    }),
    limit: Joi.number().integer().min(1).max(100).default(10).messages({
      "number.base": "Limit must be a number.",
      "number.min": "Limit must be at least 1.",
      "number.max": "Limit cannot exceed 100.",
    }),
  }).optional(),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid("start_time", "end_time", "created_at", "updated_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("course"))
    .optional(),

  filter: Joi.object({
    course_id: Joi.string().uuid().optional().messages({
      "string.base": "Course ID must be a string.",
      "string.uuid": "Course ID must be a valid UUID.",
    }),
    start_date: Joi.date().optional().messages({
      "date.base": "Start date must be a valid date.",
    }),
    end_date: Joi.date().optional().messages({
      "date.base": "End date must be a valid date.",
    }),
  }).optional(),
});

export {
  createScheduleSchema,
  updateScheduleSchema,
  getAllScheduleParamsSchema,
};
