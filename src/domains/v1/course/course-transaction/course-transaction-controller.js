import BaseError from "../../../../base-classes/base-error.js";
import {
  createdResponse,
  successResponse,
} from "../../../../utils/response.js";
import CourseTransactionService from "./course-transaction-service.js";

class CourseTransactionController {
  async getAll(req, res) {
    const data = await CourseTransactionService.getAll(
      req.validatedQuery,
      req.user
    );

    return successResponse(
      res,
      data.data,
      "Course transactions retrieved successfully",
      data.meta
    );
  }

  async create(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    const data = await CourseTransactionService.create(value);

    return createdResponse(
      res,
      data.courseTransaction,
      "Course transaction created successfully"
    );
  }

  async notify(req, res) {
    if (req.body == undefined) {
      throw BaseError.badRequest("Request body is missing");
    }

    const value = req.body;

    await CourseTransactionService.notify(value);

    return successResponse(
      res,
      null,
      "Course transaction notification processed successfully"
    );
  }
}

export default new CourseTransactionController();
