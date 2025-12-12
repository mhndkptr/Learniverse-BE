import Joi from "joi";
import CourseEnrollmentRole from "../../../../common/enums/course-enrollment-role-enum.js";

const createCourseEnrollmentSchema = Joi.object({
  course_id: Joi.string().uuid().required().messages({
    "string.empty": "Course ID is required.",
  }),
  user_id: Joi.string().uuid().required().messages({
    "string.empty": "User ID is required.",
  }),
  course_transaction_id: Joi.string().uuid().optional(),
  role: Joi.string()
    .valid(...Object.values(CourseEnrollmentRole))
    .required()
    .messages({
      "any.only": `Role must be either ${Object.values(
        CourseEnrollmentRole
      ).join(", ")}.`,
      "string.empty": "Role is required.",
    }),
});

const getAllCourseEnrollmentParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(false),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }).optional(),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string().valid("created_at", "updated_at").required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("course_transaction", "course", "user"))
    .optional(),

  search: Joi.string().allow("", null).optional(),

  filter: Joi.object({
    role: Joi.string().valid(...Object.values(CourseEnrollmentRole)),
    user_id: Joi.string().uuid(),
    course_id: Joi.string().uuid(),
    course_transaction_id: Joi.string().uuid(),
  }).optional(),
});

export { createCourseEnrollmentSchema, getAllCourseEnrollmentParamsSchema };
