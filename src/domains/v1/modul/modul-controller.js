import BaseError from "../../../base-classes/base-error.js";
import { createdResponse, successResponse } from "../../../utils/response.js";
import ModulService from "./modul-service.js";

class ModulController {
  async getAll(req, res) {
    const data = await ModulService.getAll();
    return successResponse(res, data.data, "All moduls retrieved successfully",data.meta);
  }

  async getById(req, res) {
    const { id } = req.params;

    if (!id) {
      throw BaseError.badRequest("Modul ID is required");
    }

    const data = await ModulService.getById(id);

    if (!data) {
      throw BaseError.notFound("Modul not found");
    }

    return successResponse(res, data, "Modul retrieved successfully");
  }

  async create(req, res) {
    if (!req.body) {
      throw BaseError.badRequest("Request body is missing");
    }

    const { title, description, file_name, modul_uri, course_id } = req.body;

    const data = await ModulService.create({
      title,
      description,
      file_name,
      modul_uri,
      course_id,
    });

    return createdResponse(res, data, "Modul created successfully");
  }

  async update(req, res) {
    const { id } = req.params;

    if (!id) {
      throw BaseError.badRequest("Modul ID is required");
    }

    if (!req.body) {
      throw BaseError.badRequest("Request body is missing");
    }

    const data = await ModulService.update(id, req.body);

    return successResponse(res, data, "Modul updated successfully");
  }

  async remove(req, res) {
    const { id } = req.params;

    if (!id) {
      throw BaseError.badRequest("Modul ID is required");
    }

    await ModulService.remove(id);

    return successResponse(res, null, "Modul deleted successfully");
  }
}

export default new ModulController();
