import Joi from "joi";

export const createCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  code: Joi.string().alphanum().min(3).max(10).required(),
  description: Joi.string().allow("").optional(),
});

export const updateCourseSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  code: Joi.string().alphanum().min(3).max(10).optional(),
  description: Joi.string().allow("").optional(),
});
