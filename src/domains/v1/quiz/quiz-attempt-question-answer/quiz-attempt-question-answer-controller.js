import BaseError from "../../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../../utils/response.js";
import QuizAttemptQuestionAnswerService from "./quiz-attempt-question-answer-service.js";

class QuizAttemptQuestionAnswerController {
  async getAll(req, res) {
    const items = await QuizAttemptQuestionAnswerService.getAll(req.validatedQuery);

    return successResponse(
      res,
      items.data,
      "Quiz attempt question answers retrieved successfully",
      items.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;

    const data = await QuizAttemptQuestionAnswerService.getById(id);

    return successResponse(res, data, "Quiz attempt question answer retrieved successfully");
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await QuizAttemptQuestionAnswerService.create(value, req.user);

    return createdResponse(res, data, "Quiz attempt question answer created successfully");
  }

  async update(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { id } = req.params;
    const value = req.body;

    const data = await QuizAttemptQuestionAnswerService.update(id, value, req.user);

    return successResponse(res, data, "Quiz attempt question answer updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;

    const data = await QuizAttemptQuestionAnswerService.delete(id, req.user);

    return successResponse(res, data.data, data.message);
  }
}

export default new QuizAttemptQuestionAnswerController();