import Joi from "joi";


const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title must be at most 100 characters.",
  }),
  code: Joi.string().alphanum().min(3).max(10).required().messages({
    "string.empty": "Code is required.",
    "string.alphanum": "Code must be alphanumeric.",
    "string.min": "Code must be at least 3 characters.",
    "string.max": "Code must be at most 10 characters.",
  }),
  content: Joi.string().required().messages({
    "string.empty": "Content is required.",
  }),
  cover_uri: Joi.string().uri().required().messages({
    "string.empty": "Cover URI is required.",
    "string.uri": "Cover URI must be a valid URL.",
  }),
  price: Joi.number().positive().required().messages({
    "number.base": "Price must be a number.",
    "number.positive": "Price must be positive.",
    "any.required": "Price is required.",
  }),
  description: Joi.string().allow("").optional(),
  is_open_registration_member: Joi.boolean().optional(),
  is_open_registration_mentor: Joi.boolean().optional(),
});

const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  code: Joi.string().alphanum().min(3).max(10).optional(),
  content: Joi.string().optional(),
  cover_uri: Joi.string().uri().optional(),
  price: Joi.number().positive().optional(),
  description: Joi.string().allow("").optional(),
  is_open_registration_member: Joi.boolean().optional(),
  is_open_registration_mentor: Joi.boolean().optional(),
});

export { createCourseSchema, updateCourseSchema };
