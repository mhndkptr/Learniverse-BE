import ScheduleService from "./schedule-service.js";
import {
  successResponse,
  createdResponse,
  updatedResponse,
} from "../../../utils/response.js";

class ScheduleController {
  async getAll(req, res) {
    const schedules = await ScheduleService.getAll();
    return successResponse(res, schedules, "Schedules retrieved successfully");
  }

  async getById(req, res) {
    const { id } = req.params;
    const schedule = await ScheduleService.getById(id);
    return successResponse(res, schedule, "Schedule retrieved successfully");
  }

  async create(req, res) {
    const schedule = await ScheduleService.create(req.body);
    return createdResponse(res, schedule, "Schedule created successfully");
  }

  async update(req, res) {
    const { id } = req.params;
    const updated = await ScheduleService.update(id, req.body);
    return updatedResponse(res, updated, "Schedule updated successfully");
  }

  async remove(req, res) {
    const { id } = req.params;
    const result = await ScheduleService.remove(id);
    return successResponse(res, result, "Schedule deleted successfully");
  }
}

export default new ScheduleController();
