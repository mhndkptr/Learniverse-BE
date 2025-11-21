import Joi from "joi";

const createCourseTransactionSchema = Joi.object({
  course_id: Joi.string().uuid().required().messages({
    "string.base": "Course ID must be a string.",
    "string.uuid": "Course ID must be a valid UUID.",
    "any.required": "Course ID is required.",
  }),
  user_id: Joi.string().uuid().required().messages({
    "string.base": "User ID must be a string.",
    "string.uuid": "User ID must be a valid UUID.",
    "any.required": "User ID is required.",
  }),
});

const getAllCourseTransactionParamsSchema = Joi.object({
  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid("status", "created_at", "updated_at")
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("course_enrollment", "course", "user"))
    .optional(),

  filter: Joi.object({
    status: Joi.string(),
    user_id: Joi.string().uuid(),
    course_id: Joi.string().uuid(),
    course_enrollment_id: Joi.string().uuid(),
  }).optional(),
});

export { createCourseTransactionSchema, getAllCourseTransactionParamsSchema };
