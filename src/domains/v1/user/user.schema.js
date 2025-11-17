import Joi from "joi";
import Role from "../../../common/enums/role-enum.js";

// =======================================================
// CREATE USER
// =======================================================
const createUserSchema = Joi.object({
  name: Joi.string().min(3).max(100).required(),
  username: Joi.string().alphanum().min(3).max(50).required(),
  email: Joi.string().email().required(),
  phone_number: Joi.string()
    .pattern(/^[0-9+\-\s]{8,20}$/)
    .required(),
  password: Joi.string().min(6).max(100).required(),
  password_confirmation: Joi.string()
    .valid(Joi.ref("password"))
    .required()
    .messages({
      "any.only": "Password confirmation does not match password.",
    }),
  profile_uri: Joi.string().uri().allow("", null).optional(),
  role: Joi.string()
    .valid(Role.ADMIN, Role.STUDENT)
    .required(),

  verified_at: Joi.date().optional(),
}).messages({
  "any.required": "All required fields must be provided.",
});

// =======================================================
// UPDATE USER
// =======================================================
const updateUserSchema = Joi.object({
  name: Joi.string().min(3).max(100).optional(),
  username: Joi.string().alphanum().min(3).max(50).optional(),
  email: Joi.string().email().optional(),
  phone_number: Joi.string()
    .pattern(/^[0-9+\-\s]{8,20}$/)
    .optional(),
  password: Joi.string().min(6).max(100).optional(),
  password_confirmation: Joi.when("password", {
    is: Joi.exist(),
    then: Joi.string()
      .valid(Joi.ref("password"))
      .required()
      .messages({
        "any.only": "Password confirmation does not match password.",
      }),
    otherwise: Joi.forbidden(),
  }),
  profile_uri: Joi.string().uri().allow("", null).optional(),
  role: Joi.string()
    .valid(Role.ADMIN, Role.STUDENT)
    .optional(),
  verified_at: Joi.date().optional(),
  deleted_at: Joi.date().optional(),
}).min(1).messages({
  "object.min": "At least one field must be provided for update.",
});

// =======================================================
// GET ALL PARAMS (untuk listing user)
// =======================================================
const getAllUserParamsSchema = Joi.object({
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
            "name",
            "username",
            "email",
            "phone_number",
            "role",
            "created_at",
            "updated_at"
          )
          .required(),
        direction: Joi.string().valid("asc", "desc").default("asc"),
      })
    )
    .optional(),

  include_relation: Joi.array()
    .items(
      Joi.string().valid(
        "mentors",
        "course_transactions",
        "course_enrollments",
        "quiz_attempts"
      )
    )
    .optional(),

  search: Joi.string().allow("", null).optional(),

  filter: Joi.object({
    role: Joi.string().valid(Role.ADMIN, Role.STUDENT).optional(),
    verified: Joi.boolean().optional(), // untuk user yang sudah/belum terverifikasi
    deleted: Joi.boolean().optional(),  // untuk data soft delete (deleted_at)
  }).optional(),
});

export {
  createUserSchema,
  updateUserSchema,
  getAllUserParamsSchema,
};
