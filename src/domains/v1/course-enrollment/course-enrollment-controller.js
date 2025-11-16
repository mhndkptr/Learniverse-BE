import BaseError from "../../../base-classes/base-error.js";
import { createdResponse } from "../../../utils/response.js";
import CourseEnrollmentService from "./course-enrollment-service.js";

class CourseEnrollmentController {
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
