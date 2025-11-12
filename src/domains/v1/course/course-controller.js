import BaseError from "../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../utils/response.js";
import CourseService from "./course-service.js";

class CourseController {
  async getAll(req, res) {
    const result = await CourseService.getAll(req.validatedQuery || {});
    return successResponse(
      res,
      result.data,
      "Courses retrieved successfully",
      result.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;
    const data = await CourseService.getById(id);
    return successResponse(res, data, "Course retrieved successfully");
  }

  async create(req, res) {
    if (!req.body) throw BaseError.badRequest("Request body is missing");
    if (!req.file) throw BaseError.badRequest("Image file is missing");
    const data = await CourseService.create(req.body, req.user, req.file);
    return createdResponse(res, data, "Course created successfully");
  }

  async update(req, res) {
    const { id } = req.params;
    if (!req.body) throw BaseError.badRequest("Request body is missing");
    const data = await CourseService.update(id, req.body, req.user, req.file);
    return successResponse(res, data, "Course updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;
    const data = await CourseService.delete(id, req.user);
    return successResponse(res, data.data, data.message);
  }
}

export default new CourseController();
