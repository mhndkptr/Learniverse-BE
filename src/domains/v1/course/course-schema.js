import Joi from "joi";

const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(150).required(),
  description: Joi.string().allow("", null).optional(),
  content: Joi.string().allow("", null).required(),
  code: Joi.string().alphanum().min(3).max(10).required(),

  price: Joi.number().min(0).precision(2).required(),

  is_open_registration_member: Joi.boolean().default(false),
  is_open_registration_mentor: Joi.boolean().default(false),
}).messages({
  "any.required": "All required fields must be provided.",
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(150).optional(),
  description: Joi.string().allow("", null).optional(),
  content: Joi.string().allow("", null).optional(),
  code: Joi.string().alphanum().min(3).max(10).optional(),

  price: Joi.number().min(0).precision(2).optional(),

  is_open_registration_member: Joi.boolean().optional(),
  is_open_registration_mentor: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    "object.min": "At least one field must be provided for update.",
  });

const getAllCourseParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(false),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }).optional(),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid("title", "price", "created_at", "updated_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(
      Joi.string().valid(
        "mentors",
        "moduls",
        "quizzes",
        "course_enrollments",
        "course_transactions",
        "schedules"
      )
    )
    .optional(),

  search: Joi.string().allow("", null).optional(),

  advSearch: Joi.object({
    enrolled: Joi.object({
      member: Joi.boolean().optional(),
      mentor: Joi.boolean().optional(),
    }).optional(),
  }).optional(),

  filter: Joi.object({
    is_open_registration_member: Joi.boolean().optional(),
    is_open_registration_mentor: Joi.boolean().optional(),
  }).optional(),
});

export { createCourseSchema, updateCourseSchema, getAllCourseParamsSchema };
