
import UserService from "./user-service.js";
import {
	successResponse,
	createdResponse,
	updatedResponse,
} from "../../../utils/response.js";

class UserController {
	async getAll(req, res) {
	const result = await UserService.getAll(req.validatedQuery || {});
	return successResponse(
		res,
		result.data,
		"Users retrieved successfully",
		result.meta
	);
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

}

export default new UserController();

