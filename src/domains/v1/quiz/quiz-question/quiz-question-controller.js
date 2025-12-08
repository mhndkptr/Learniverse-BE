import BaseError from "../../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../../utils/response.js";
import QuizQuestionService from "./quiz-question-service.js";

class QuizQuestionController {
  async getAll(req, res) {
    const quizQuestions = await QuizQuestionService.getAll(req.validatedQuery);

    return successResponse(
      res,
      quizQuestions.data,
      "Quiz question data retrieved successfully",
      quizQuestions.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;

    const data = await QuizQuestionService.getById(id);

    return successResponse(res, data, "Quiz question data retrieved successfully");
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await QuizQuestionService.create(value, req.user);

    return createdResponse(res, data, "Quiz question created successfully");
  }

  async update(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { id } = req.params;
    const value = req.body;

    const data = await QuizQuestionService.update(id, value, req.user);

    return successResponse(res, data, "Quiz question updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;

    const data = await QuizQuestionService.delete(id, req.user);

    return successResponse(res, data.data, data.message);
  }
}

export default new QuizQuestionController();