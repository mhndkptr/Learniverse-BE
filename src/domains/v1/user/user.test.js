import { jest } from "@jest/globals";
import request from "supertest";
import BaseError from "../../../base-classes/base-error.js";
import { randomUUID } from "crypto";
import Role from "../../../common/enums/role-enum.js";

// =======================================================
// 1. SETUP MOCKS
// =======================================================

// A. Mock Auth Middleware
// Kita buat variable agar bisa diubah implementation-nya per test case
const mockAuthenticate = jest.fn((req, res, next) => {
  req.user = { id: "admin-uuid", role: Role.ADMIN }; // Default: Admin
  next();
});

const mockAuthorizeRoles = jest.fn((roles) => {
  return (req, res, next) => next(); // Bypass role check di route level
});

await jest.unstable_mockModule(
  "../../../middlewares/auth-token-middleware.js",
  () => ({
    default: {
      authenticate: mockAuthenticate,
      authorizeRoles: mockAuthorizeRoles,
    },
  })
);

// B. Mock Upload Middleware (PENTING: Bypass Multer di route PATCH)
await jest.unstable_mockModule(
  "../../../middlewares/upload-file-middleware.js",
  () => ({
    default: () => ({
      single: () => (req, res, next) => next(), // Bypass upload logic
    }),
  })
);

// C. Mock User Service
await jest.unstable_mockModule("./user-service.js", () => ({
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  },
}));

// =======================================================
// 2. IMPORT MODULES
// =======================================================
const { default: UserService } = await import("./user-service.js");
const { default: app } = await import("../../../app.js");

// =======================================================
// 3. TEST SUITE
// =======================================================
describe("User Endpoints", () => {
  const adminId = "admin-uuid";
  const studentId = "student-uuid";
  const otherUserId = "other-user-uuid";

  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default auth menjadi ADMIN
    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: adminId, role: Role.ADMIN };
      next();
    });
  });

  // -------------------------------------------------------
  // GET ALL USERS
  // -------------------------------------------------------
  describe("GET /api/v1/user", () => {
    // Asumsi route dimount di /api/v1/users (jamak) sesuai standar REST
    // Jika di route utama kamu pakai /user (tunggal), ubah URL di bawah.

    it("Harus berhasil mengambil list user (200) oleh Admin", async () => {
      const mockResult = {
        data: [{ id: studentId, name: "Student 1", role: Role.STUDENT }],
        meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
      };

      UserService.getAll.mockResolvedValue(mockResult);

      const res = await request(app).get("/api/v1/user");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(1);
      expect(UserService.getAll).toHaveBeenCalled();
    });

    it("Harus gagal (401) jika token invalid", async () => {
      mockAuthenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({ message: "Unauthorized" });
      });

      const res = await request(app).get("/api/v1/user");

      expect(res.statusCode).toEqual(401);
      expect(UserService.getAll).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // GET USER BY ID
  // -------------------------------------------------------
  describe("GET /api/v1/user/:id", () => {
    it("Harus berhasil mengambil detail user (200)", async () => {
      const mockUser = { id: studentId, name: "Student Detail" };
      UserService.getById.mockResolvedValue(mockUser);

      const res = await request(app).get(`/api/v1/user/${studentId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe(studentId);
      expect(UserService.getById).toHaveBeenCalledWith(studentId);
    });

    it("Harus gagal (404) jika user tidak ditemukan", async () => {
      UserService.getById.mockRejectedValue(BaseError.notFound("User not found"));

      const res = await request(app).get("/api/v1/user/invalid-id");

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("User not found");
    });
  });

  // -------------------------------------------------------
  // CREATE USER
  // -------------------------------------------------------
  describe("POST /api/v1/user", () => {
    const validPayload = {
      name: "New Student",
      username: "newstudent",
      email: "new@student.com",
      phone_number: "081234567890",
      password: "password123",
      password_confirmation: "password123", // Wajib sama
      role: Role.STUDENT,
    };

    it("Harus berhasil membuat user (201) dengan data valid", async () => {
      const mockCreated = { ...validPayload, id: randomUUID(), password: "hashed" };
      UserService.create.mockResolvedValue(mockCreated);

      const res = await request(app)
        .post("/api/v1/user")
        .send(validPayload);

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.email).toBe(validPayload.email);
      expect(UserService.create).toHaveBeenCalled();
    });

    it("Harus gagal (422) jika password confirmation tidak cocok", async () => {
      const invalidPayload = {
        ...validPayload,
        password_confirmation: "differentpass",
      };

      const res = await request(app)
        .post("/api/v1/user")
        .send(invalidPayload);

      expect(res.statusCode).toEqual(422);
      expect(UserService.create).not.toHaveBeenCalled();
    });

    it("Harus gagal (450) jika username/email duplikat (Service Error)", async () => {
      UserService.create.mockRejectedValue(BaseError.duplicate("Username or email already exists"));

      const res = await request(app)
        .post("/api/v1/user")
        .send(validPayload);

      expect(res.statusCode).toEqual(450); // Conflict
      expect(res.body.message).toContain("already exists");
    });
  });

  // -------------------------------------------------------
  // UPDATE USER (PATCH) - Includes Logic Test
  // -------------------------------------------------------
  describe("PATCH /api/v1/user/:id", () => {
    const updatePayload = { name: "Updated Name" };

    it("Admin boleh mengupdate user manapun (200)", async () => {
      // Mock Auth sebagai ADMIN (Default beforeEach)
      UserService.update.mockResolvedValue({ id: otherUserId, ...updatePayload });

      const res = await request(app)
        .patch(`/api/v1/user/${otherUserId}`)
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(UserService.update).toHaveBeenCalled();
    });

    it("User boleh mengupdate profilenya sendiri (200)", async () => {
      // Mock Auth sebagai STUDENT dengan ID yang sama dengan params URL
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: studentId, role: Role.STUDENT };
        next();
      });

      UserService.update.mockResolvedValue({ id: studentId, ...updatePayload });

      const res = await request(app)
        .patch(`/api/v1/user/${studentId}`) // ID URL = ID Login
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(UserService.update).toHaveBeenCalled();
    });

    it("User TIDAK BOLEH mengupdate profile orang lain (403)", async () => {
      // Mock Auth sebagai STUDENT dengan ID "studentId"
      mockAuthenticate.mockImplementation((req, res, next) => {
        req.user = { id: studentId, role: Role.STUDENT };
        next();
      });

      // Mencoba update ID "otherUserId"
      const res = await request(app)
        .patch(`/api/v1/user/${otherUserId}`)
        .send(updatePayload);

      // Controller logic harus melempar 403 Forbidden
      expect(res.statusCode).toEqual(403);
      expect(res.body.message).toBe("You can only update your own profile");
      expect(UserService.update).not.toHaveBeenCalled();
    });

    it("Harus gagal (422) jika format email salah", async () => {
        const res = await request(app)
            .patch(`/api/v1/user/${adminId}`)
            .send({ email: "not-an-email" });

        expect(res.statusCode).toEqual(422);
    });
  });

  // -------------------------------------------------------
  // DELETE USER (Soft Delete)
  // -------------------------------------------------------
  describe("DELETE /api/v1/user/:id", () => {
    it("Harus berhasil menghapus user (200)", async () => {
      UserService.remove.mockResolvedValue({ message: "User deleted successfully" });

      const res = await request(app).delete(`/api/v1/user/${otherUserId}`);

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("User deleted successfully");
      expect(UserService.remove).toHaveBeenCalledWith(otherUserId);
    });

    it("Harus gagal (404) jika user tidak ditemukan", async () => {
      UserService.remove.mockRejectedValue(BaseError.notFound("User not found"));

      const res = await request(app).delete(`/api/v1/user/${otherUserId}`);

      expect(res.statusCode).toEqual(404);
    });
  });
});