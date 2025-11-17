import Joi from "joi";
import MentorStatus from "../../../common/enums/mentor-status-enum.js"; // use mentor status enum

// =======================================================
// CREATE MENTOR
// =======================================================
const createMentorSchema = Joi.object({
  bio: Joi.string().min(10).max(1000).required(),
  reason: Joi.string().min(10).max(1000).required(),
  motivation: Joi.string().min(10).max(1000).required(),
  cv_uri: Joi.string().uri().required(),
  portfolio_uri: Joi.string().uri().required(),
  status: Joi.string()
    .valid(
      MentorStatus.ON_REVIEW,
      MentorStatus.ACCEPTED,
      MentorStatus.REJECTED
    )
    .default(MentorStatus.ON_REVIEW),
  user_id: Joi.string().uuid().required(),
  course_id: Joi.string().uuid().required(),
}).messages({
  "any.required": "All required fields must be provided.",
});

// =======================================================
// UPDATE MENTOR
// =======================================================
const updateMentorSchema = Joi.object({
  bio: Joi.string().min(10).max(1000).optional(),
  reason: Joi.string().min(10).max(1000).optional(),
  motivation: Joi.string().min(10).max(1000).optional(),
  cv_uri: Joi.string().uri().optional(),
  portfolio_uri: Joi.string().uri().optional(),
  status: Joi.string()
    .valid(
      MentorStatus.ON_REVIEW,
      MentorStatus.ACCEPTED,
      MentorStatus.REJECTED
    )
    .optional(),
  user_id: Joi.string().uuid().optional(),
  course_id: Joi.string().uuid().optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update.",
});

// =======================================================
// GET ALL PARAMS (untuk listing mentor)
// =======================================================
const getAllMentorParamsSchema = Joi.object({
  get_all: Joi.boolean().optional().default(false),

  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
  }).optional(),

  order_by: Joi.array()
    .items(
      Joi.object({
        field: Joi.string()
          .valid(
            "bio",
            "reason",
            "motivation",
            "status",
            "created_at",
            "updated_at"
          )
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(Joi.string().valid("user", "course"))
    .optional(),

  search: Joi.string().allow("", null).optional(),

  filter: Joi.object({
    status: Joi.string()
      .valid(
        MentorStatus.ON_REVIEW,
        MentorStatus.ACCEPTED,
        MentorStatus.REJECTED
      )
      .optional(),
    course_id: Joi.string().uuid().optional(),
    user_id: Joi.string().uuid().optional(),
  }).optional(),
});

export {
  createMentorSchema,
  updateMentorSchema,
  getAllMentorParamsSchema,
};
