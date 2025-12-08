import BaseError from "../../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../../utils/response.js";
import QuizOptionAnswerService from "./quiz-option-answer-service.js";

class QuizOptionAnswerController {
  async getAll(req, res) {
    const items = await QuizOptionAnswerService.getAll(req.validatedQuery);

    return successResponse(
      res,
      items.data,
      "Quiz option answers retrieved successfully",
      items.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;

    const data = await QuizOptionAnswerService.getById(id);

    return successResponse(res, data, "Quiz option answer retrieved successfully");
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await QuizOptionAnswerService.create(value, req.user);

    return createdResponse(res, data, "Quiz option answer created successfully");
  }

  async update(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { id } = req.params;
    const value = req.body;

    const data = await QuizOptionAnswerService.update(id, value, req.user);

    return successResponse(res, data, "Quiz option answer updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;

    const data = await QuizOptionAnswerService.delete(id, req.user);

    return successResponse(res, data.data, data.message);
  }
}

export default new QuizOptionAnswerController();