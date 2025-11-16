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

export { createCourseEnrollmentSchema };
