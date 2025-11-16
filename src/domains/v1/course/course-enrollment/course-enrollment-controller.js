import BaseError from "../../../../base-classes/base-error.js";
import {
  createdResponse,
  successResponse,
} from "../../../../utils/response.js";
import CourseEnrollmentService from "./course-enrollment-service.js";

class CourseEnrollmentController {
  async getAll(req, res) {
    const data = await CourseEnrollmentService.getAll(req.user);

    return successResponse(
      res,
      data,
      "Course enrollments retrieved successfully"
    );
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await CourseEnrollmentService.create(value);

    return createdResponse(
      res,
      data.courseEnrollment,
      "Enrollment created successfully"
    );
  }
}

export default new CourseEnrollmentController();
