import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import path from "path";
import fs from "fs";
import { hashPassword } from "../../../utils/passwordConfig.js";

class UserService {
	constructor() {
		this.prisma = new PrismaService();
	}

	async getAll() {
		return this.prisma.user.findMany({ where: { deleted_at: null } });
	}

	async getById(id) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) throw BaseError.notFound("User not found");
		return user;
	}

	async create(data) {
		const existing = await this.prisma.user.findFirst({
			where: {
				OR: [{ username: data.username }, { email: data.email }],
			},
		});
		if (existing) throw BaseError.duplicate("Username or email already exists");

		// hash password before create
		const hashed = await hashPassword(data.password);
		const payload = { ...data, password: hashed };

		const user = await this.prisma.user.create({ data: payload });
		return user;
	}

	async update(id, data) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) throw BaseError.notFound("User not found");

		// Prevent duplicate username/email when updating
		if (data.username || data.email) {
			const conflict = await this.prisma.user.findFirst({
				where: {
					AND: [
						{ id: { not: id } },
						{
							OR: [
								data.username ? { username: data.username } : undefined,
								data.email ? { email: data.email } : undefined,
							].filter(Boolean),
						},
					],
				},
			});
			if (conflict) throw BaseError.duplicate("Username or email already exists");
		}

		// If password provided, hash it
		const updateData = { ...data };
		if (data.password) {
			updateData.password = await hashPassword(data.password);
		}

		const updated = await this.prisma.user.update({ where: { id }, data: updateData });
		return updated;
	}

	async remove(id) {
		const user = await this.prisma.user.findUnique({ where: { id } });
		if (!user) throw BaseError.notFound("User not found");

		await this.prisma.user.update({ where: { id }, data: { deleted_at: new Date() } });
		return { message: "User deleted successfully" };
	}

	async uploadProfile(userId, file) {
		const user = await this.prisma.user.findUnique({ where: { id: userId } });
		if (!user) throw BaseError.notFound("User not found");
		if (!file) throw BaseError.badRequest("No file uploaded");

		const uploadsDir = path.join(process.cwd(), "uploads", "profiles");
		if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

		const targetPath = path.join(uploadsDir, file.originalname);
		fs.renameSync(file.path, targetPath);

		const profileUri = `/uploads/profiles/${file.originalname}`;

		const updated = await this.prisma.user.update({ where: { id: userId }, data: { profile_uri: profileUri } });
		return updated;
	}
}

export default new UserService();

