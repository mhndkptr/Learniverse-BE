import BaseError from "../../../base-classes/base-error.js";
import { PrismaService } from "../../../common/services/prisma-service.js";
import { hashPassword, matchPassword } from "../../../utils/passwordConfig.js";
import { buildQueryOptions } from "../../../utils/buildQueryOptions.js";
import userQueryConfig from "./user-query-config.js";
import { CloudinaryService } from "../../../common/services/cloudinary-service.js";

class UserService {
  constructor() {
    this.prisma = new PrismaService();
    this.cloudinary = new CloudinaryService();
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

  async update(id, data, file) {
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
      if (conflict)
        throw BaseError.duplicate("Username or email already exists");
    }

    // If password provided, hash it
    const updateData = { ...data };
    if (updateData.password_confirmation) {
      delete updateData.password_confirmation;
    }
    if (data.password) {
      updateData.password = await hashPassword(data.password);
    }

    // handle profile image upload
    if (file) {
      // delete old image if exists (best-effort)
      if (user.profile_uri) {
        try {
          await this.cloudinary.deleteFromUrlsCloudinary([user.profile_uri]);
        } catch (err) {
          console.warn(
            "[WARN] Failed to delete old profile image, continuing update...",
            err.message
          );
        }
      }

      const upload = await this.cloudinary.uploadFromBufferToCloudinary(
        file.buffer,
        "user/profile"
      );
      if (upload?.secure_url) {
        updateData.profile_uri = upload.secure_url;
      }
    }

    const updated = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });
    return updated;
  }

  async remove(id) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw BaseError.notFound("User not found");

    await this.prisma.user.update({
      where: { id },
      data: { deleted_at: new Date() },
    });
    return { message: "User deleted successfully" };
  }

  async changePassword(id, payload) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw BaseError.notFound("User not found");

    const isMatch = await matchPassword(payload.old_password, user.password);
    if (!isMatch) throw BaseError.badRequest("Old password is incorrect");

    const hashed = await hashPassword(payload.new_password);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
    });
    return updated;
  }
}

export default new UserService();
