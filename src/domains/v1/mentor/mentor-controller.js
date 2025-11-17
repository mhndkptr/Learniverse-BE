import BaseError from "../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../utils/response.js";
import MentorService from "./mentor-service.js";

class MentorController {
  // GET ALL mentors
  async getAll(req, res) {
    const result = await MentorService.getAll(req.validatedQuery || {});
    return successResponse(
      res,
      result.data,
      "Mentors retrieved successfully",
      result.meta
    );
  }

  // GET mentor by ID
  async getById(req, res) {
    const { id } = req.params;
    const data = await MentorService.getById(id);
    return successResponse(res, data, "Mentor retrieved successfully");
  }

  // CREATE new mentor
  async create(req, res) {
    if (!req.body) throw BaseError.badRequest("Request body is missing");
    const data = await MentorService.create(req.body, req.user);
    return createdResponse(res, data, "Mentor created successfully");
  }

  // UPDATE mentor
  async update(req, res) {
    const { id } = req.params;
    if (!req.body) throw BaseError.badRequest("Request body is missing");
    const data = await MentorService.update(id, req.body, req.user);
    return successResponse(res, data, "Mentor updated successfully");
  }

  // DELETE mentor
  async delete(req, res) {
    const { id } = req.params;
    const data = await MentorService.delete(id, req.user);
    return successResponse(res, data.data, data.message);
  }
}

export default new MentorController();
