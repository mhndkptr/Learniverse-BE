import BaseError from "../../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../../utils/response.js";
import QuizAttemptService from "./quiz-attempt-service.js";

class QuizAttemptController {
  async getAll(req, res) {
    const quiz = await QuizAttemptService.getAll(req.validatedQuery);

    return successResponse(
      res,
      quiz.data,
      "Quiz attempt data retrieved successfully",
      quiz.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;

    const data = await QuizAttemptService.getById(id);

    return successResponse(res, data, "Quiz attempt data retrieved successfully");
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await QuizAttemptService.create(value, req.user);

    return createdResponse(res, data, "Quiz attempt created successfully");
  }

  async update(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { id } = req.params;
    const value = req.body;

    const data = await QuizAttemptService.update(id, value, req.user);

    return successResponse(res, data, "Quiz attempt updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;

    const data = await QuizAttemptService.delete(id, req.user);

    return successResponse(res, data.data, data.message);
  }
}

export default new QuizAttemptController();