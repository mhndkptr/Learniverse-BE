import BaseError from "../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../utils/response.js";
import QuizService from "./quiz-service.js";

class QuizController {
  async getAll(req, res) {
    const quiz = await QuizService.getAll(
      req.validatedQuery,
      req.user,
      req.enrollmentRole
    );

    return successResponse(
      res,
      quiz.data,
      "Quiz data retrieved successfully",
      quiz.meta
    );
  }

  async getAllForStudent(req, res) {
    const quiz = await QuizService.getAllForStudent(req.user);

    return successResponse(
      res,
      quiz.data,
      "Active quiz data retrieved successfully",
      quiz.meta
    );
  }

  async getById(req, res) {
    const { id } = req.params;

    const data = await QuizService.getById(id);

    return successResponse(res, data, "Quiz data retrieved successfully");
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await QuizService.create(value, req.user);

    return createdResponse(res, data, "Quiz created successfully");
  }

  async update(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { id } = req.params;
    const value = req.body;

    const data = await QuizService.update(id, value, req.user);

    return successResponse(res, data, "Quiz updated successfully");
  }

  async delete(req, res) {
    const { id } = req.params;

    const data = await QuizService.delete(id, req.user);

    return successResponse(res, data.data, data.message);
  }
}

export default new QuizController();
