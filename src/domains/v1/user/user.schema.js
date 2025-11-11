import Joi from "joi";

const createUserSchema = Joi.object({
	name: Joi.string().min(3).max(100).required().messages({
		"string.empty": "Name is required.",
		"string.min": "Name must be at least 3 characters.",
		"string.max": "Name must be at most 100 characters.",
	}),
	username: Joi.string().alphanum().min(3).max(30).required().messages({
		"string.empty": "Username is required.",
		"string.alphanum": "Username must be alphanumeric.",
		"string.min": "Username must be at least 3 characters.",
		"string.max": "Username must be at most 30 characters.",
	}),
	email: Joi.string().email().required().messages({
		"string.empty": "Email is required.",
		"string.email": "Email must be a valid email address.",
	}),
	phone_number: Joi.string().min(6).max(20).required().messages({
		"string.empty": "Phone number is required.",
		"string.min": "Phone number must be at least 6 characters.",
		"string.max": "Phone number must be at most 20 characters.",
	}),
	password: Joi.string().min(6).max(128).required().messages({
		"string.empty": "Password is required.",
		"string.min": "Password must be at least 6 characters.",
		"string.max": "Password must be at most 128 characters.",
	}),
	profile_uri: Joi.string().uri().optional().allow(null, "").messages({
		"string.uri": "Profile URI must be a valid URL.",
	}),
	role: Joi.string().valid("ADMIN", "STUDENT").required().messages({
		"any.only": "Role must be either ADMIN or STUDENT.",
		"string.empty": "Role is required.",
	}),
	banned_at: Joi.date().iso().optional().allow(null),
	verified_at: Joi.date().iso().optional().allow(null),
	last_login: Joi.date().iso().optional().allow(null),
});

const updateUserSchema = Joi.object({
	name: Joi.string().min(3).max(100).optional(),
	username: Joi.string().alphanum().min(3).max(30).optional(),
	email: Joi.string().email().optional(),
	phone_number: Joi.string().min(6).max(20).optional(),
	password: Joi.string().min(6).max(128).optional(),
	profile_uri: Joi.string().uri().optional().allow(null, ""),
	role: Joi.string().valid("ADMIN", "STUDENT").optional(),
	banned_at: Joi.date().iso().optional().allow(null),
	verified_at: Joi.date().iso().optional().allow(null),
	last_login: Joi.date().iso().optional().allow(null),
});

export { createUserSchema, updateUserSchema };

