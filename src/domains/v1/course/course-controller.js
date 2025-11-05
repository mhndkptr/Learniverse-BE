import CourseService from "./course-service.js";
import {
  successResponse,
  createdResponse,
  updatedResponse,
} from "../../../utils/response.js";

class CourseController {
  async getAll(req, res) {
    const courses = await CourseService.getAll();
    return successResponse(res, courses, "Courses retrieved successfully");
  }

  async getById(req, res) {
    const { id } = req.params;
    const course = await CourseService.getById(id);
    return successResponse(res, course, "Course retrieved successfully");
  }

  async create(req, res) {
    const data = await CourseService.create(req.body);
    return createdResponse(res, data, "Course created successfully");
  }

  async update(req, res) {
    const { id } = req.params;
    const data = await CourseService.update(id, req.body);
    return updatedResponse(res, data, "Course updated successfully");
  }

  async remove(req, res) {
    const { id } = req.params;
    const result = await CourseService.remove(id);
    return successResponse(res, result, "Course deleted successfully");
  }

  async upload(req, res) {
    const { id } = req.params;
    const modul = await CourseService.uploadMaterial(id, req.file);
    return successResponse(res, modul, "Material uploaded successfully");
  }
}

export default new CourseController();
