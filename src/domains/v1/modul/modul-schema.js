import Joi from "joi";

const createModulSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "Title is required.",
  }),

  description: Joi.string().required().messages({
    "string.empty": "Description is required.",
  }),

  file_name: Joi.string().required().messages({
    "string.empty": "File name is required.",
  }),

  modul_uri: Joi.string().required().messages({
    "string.empty": "Modul URI is required.",
  }),

  course_id: Joi.string().uuid().required().messages({
    "string.empty": "Course ID is required.",
    "string.guid": "Course ID must be a valid UUID.",
  }),
});

const updateModulSchema = Joi.object({
  title: Joi.string().optional(),
  description: Joi.string().optional(),
  file_name: Joi.string().optional(),
  modul_uri: Joi.string().optional(),
  course_id: Joi.string().uuid().optional(),
}).min(1).messages({
  "object.min": "At least one field must be updated.",
});

const getAllModulParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(false),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }).optional(),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid("title", "description", "created_at", "updated_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(
      Joi.string().valid("course")
    )
    .optional(),

  search: Joi.string().allow("", null).optional(),

  filter: Joi.object({
    course_id: Joi.string().uuid().optional(),
  }).optional(),
});

export { createModulSchema, updateModulSchema, getAllModulParamsSchema};
