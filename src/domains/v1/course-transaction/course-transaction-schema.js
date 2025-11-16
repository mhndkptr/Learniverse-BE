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

export { createCourseTransactionSchema };
