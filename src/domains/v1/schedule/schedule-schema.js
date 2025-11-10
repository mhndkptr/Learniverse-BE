import Joi from "joi";

const createScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).required().messages({
    "string.empty": "Title is required.",
    "string.min": "Title must be at least 3 characters.",
    "string.max": "Title must be at most 100 characters.",
  }),
  description: Joi.string().allow("").optional(),
  start_time: Joi.date().iso().required().messages({
    "date.base": "Start time must be a valid date.",
    "any.required": "Start time is required.",
  }),
  end_time: Joi.date().iso().required().messages({
    "date.base": "End time must be a valid date.",
    "any.required": "End time is required.",
  }),
  course_id: Joi.string().uuid().required().messages({
    "string.empty": "Course ID is required.",
    "string.guid": "Course ID must be a valid UUID.",
  }),
});

const updateScheduleSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().allow("").optional(),
  start_time: Joi.date().iso().optional(),
  end_time: Joi.date().iso().optional(),
});

export { createScheduleSchema, updateScheduleSchema };
