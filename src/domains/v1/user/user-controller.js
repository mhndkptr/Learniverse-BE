
import UserService from "./user-service.js";
import {
	successResponse,
	createdResponse,
	updatedResponse,
} from "../../../utils/response.js";

class UserController {
	async getAll(req, res) {
		const users = await UserService.getAll();
		return successResponse(res, users, "Users retrieved successfully");
	}

	async getById(req, res) {
		const { id } = req.params;
		const user = await UserService.getById(id);
		return successResponse(res, user, "User retrieved successfully");
	}

	async create(req, res) {
		const data = await UserService.create(req.body);
		return createdResponse(res, data, "User created successfully");
	}

	async update(req, res) {
		const { id } = req.params;
		const data = await UserService.update(id, req.body);
		return updatedResponse(res, data, "User updated successfully");
	}

	async remove(req, res) {
		const { id } = req.params;
		const result = await UserService.remove(id);
		return successResponse(res, result, "User deleted successfully");
	}

	async uploadProfile(req, res) {
		const { id } = req.params;
		const profile = await UserService.uploadProfile(id, req.file);
		return successResponse(res, profile, "Profile uploaded successfully");
	}
}

export default new UserController();

