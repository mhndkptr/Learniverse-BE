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

  async getAllMe(req, res) {
    const result = await CourseService.getAllMe(req.user);
    return successResponse(
      res,
      result.data,
      "Enrolled courses retrieved successfully",
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

    const payload = { ...req.body };

    if (payload.price) {
      payload.price = parseFloat(payload.price);
    }

    payload.is_open_registration_member =
      String(payload.is_open_registration_member) === "true";

    payload.is_open_registration_mentor =
      String(payload.is_open_registration_mentor) === "true";

    const data = await CourseService.create(payload, req.user, req.file);
    return createdResponse(res, data, "Course created successfully");
  }

  async update(req, res) {
    const { id } = req.params;
    if (!req.body) throw BaseError.badRequest("Request body is missing");

    const payload = { ...req.body };

    if (payload.price) {
      payload.price = parseFloat(payload.price);
    }

    if (payload.is_open_registration_member !== undefined) {
      payload.is_open_registration_member =
        String(payload.is_open_registration_member) === "true";
    }

    if (payload.is_open_registration_mentor !== undefined) {
      payload.is_open_registration_mentor =
        String(payload.is_open_registration_mentor) === "true";
    }

    const data = await CourseService.update(id, payload, req.user, req.file);
    return successResponse(res, data, "Course updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;
    const data = await CourseService.delete(id, req.user);
    return successResponse(res, data.data, data.message);
  }
}

export default new CourseController();
