import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import path from "path";
import fs from "fs";
import { hashPassword } from "../../../utils/passwordConfig.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import userQueryConfig from "./user-query-config.js";

class UserService {
	constructor() {
		this.prisma = new PrismaService();
	}

	async getAll(query = {}) {
  // Bangun query options berdasarkan konfigurasi user
  const options = buildQueryOptions(userQueryConfig, query);

  // Jalankan query paralel: ambil data dan total count
  const [data, count] = await Promise.all([
    this.prisma.user.findMany(options),
    this.prisma.user.count({ where: options.where }),
  ]);

  // Hitung pagination metadata
  const page = query?.pagination?.page ?? 1;
  const limit = query?.pagination?.limit ?? 10;
  const totalPages = Math.ceil(count / limit);

  return {
    data,
    meta: {
      totalItems: count,
      totalPages,
      currentPage: page,
      itemsPerPage: limit,
    },
  };
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
		delete payload.password_confirmation;
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

}

export default new UserService();

