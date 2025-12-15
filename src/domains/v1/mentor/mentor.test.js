import { jest } from "@jest/globals";
import request from "supertest";
import BaseError from "../../../base-classes/base-error.js"; // Pastikan path sesuai

// 1. Setup Mock Function untuk Middleware
const mockAuthenticate = jest.fn((req, res, next) => {
  // Default: Login sebagai ADMIN agar bisa akses semua route
  req.user = { id: "admin-uuid", role: "ADMIN" };
  next();
});

const mockAuthorizeRoles = jest.fn((roles) => {
  // Bypass logic pengecekan role, langsung next()
  return (req, res, next) => next();
});

// 2. Mock Module Middleware Auth (harus dilakukan sebelum import app)
await jest.unstable_mockModule(
  "../../../middlewares/auth-token-middleware.js",
  () => ({
    default: {
      authenticate: mockAuthenticate,
      authorizeRoles: mockAuthorizeRoles,
    },
  })
);

// 3. Mock Module Mentor Service (agar tidak connect ke Database)
await jest.unstable_mockModule("./mentor-service.js", () => ({
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// 4. Import Module Asli (Dynamic Import setelah Mocking)
const { default: MentorService } = await import("./mentor-service.js");
const { default: app } = await import("../../../app.js");

// 5. Mulai Test Suite
describe("Mentor Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default behavior middleware setiap test
    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: "admin-uuid", role: "ADMIN" };
      next();
    });
  });

  // =======================================================
  // GET ALL MENTOR
  // =======================================================
  describe("GET /api/v1/mentor", () => {
    it("Harus berhasil mengambil data mentor (200)", async () => {
      const mockResult = {
        data: [{ id: "mentor-1", bio: "Bio Test" }],
        meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
      };
      
      MentorService.getAll.mockResolvedValue(mockResult);

      const res = await request(app).get("/api/v1/mentor");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].bio).toBe("Bio Test");
      expect(MentorService.getAll).toHaveBeenCalled();
    });

    it("Harus gagal (401) jika token invalid (Simulasi Error Middleware)", async () => {
      // Override middleware khusus untuk test case ini
      mockAuthenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({
          code: 401,
          status: "UNAUTHORIZED",
          message: "Token Is Invalid",
        });
      });

      const res = await request(app).get("/api/v1/mentor");

      expect(res.statusCode).toEqual(401);
      expect(MentorService.getAll).not.toHaveBeenCalled();
    });
  });

  // =======================================================
  // GET MENTOR BY ID
  // =======================================================
  describe("GET /api/v1/mentor/:id", () => {
    it("Harus berhasil mengambil detail mentor (200)", async () => {
      const mockMentor = { id: "mentor-1", bio: "Detail Bio" };
      MentorService.getById.mockResolvedValue(mockMentor);

      const res = await request(app).get("/api/v1/mentor/mentor-1");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe("mentor-1");
      expect(MentorService.getById).toHaveBeenCalledWith("mentor-1");
    });

    it("Harus gagal (404) jika mentor tidak ditemukan", async () => {
      MentorService.getById.mockRejectedValue(BaseError.notFound("Mentor not found."));

      const res = await request(app).get("/api/v1/mentor/invalid-id");

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("Mentor not found.");
    });
  });

  // =======================================================
  // CREATE MENTOR
  // =======================================================
  describe("POST /api/v1/mentor", () => {
    // Gunakan UUID statis yang valid agar tidak ada isu generate
    const validUUID = "c56a4180-65aa-42ec-a945-5fd21dec0538";

    const validPayload = {
      bio: "Saya memiliki pengalaman 5 tahun di bidang backend.",
      reason: "Ingin berbagi ilmu kepada mahasiswa.",
      motivation: "Mencerdaskan kehidupan bangsa.",
      cv_uri: "https://example.com/cv.pdf",
      portfolio_uri: "https://example.com/portfolio",
      user_id: validUUID,
      course_id: validUUID,
    };

    it("Harus berhasil membuat mentor (201) dengan data valid", async () => {
      const mockCreatedMentor = { ...validPayload, id: "new-mentor-id", status: "ON_REVIEW" };
      
      // Pastikan mock return value sesuai
      MentorService.create.mockResolvedValue(mockCreatedMentor);

      const res = await request(app)
        .post("/api/v1/mentor")
        .send(validPayload);

      // --- DEBUGGING BLOCK ---
      // Jika status bukan 201, print errornya ke terminal biar ketahuan salahnya dimana
      if (res.statusCode !== 201) {
        console.error("❌ DEBUG JOI ERROR:", JSON.stringify(res.body, null, 2));
      }
      // -----------------------

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.id).toBe("new-mentor-id");
      expect(MentorService.create).toHaveBeenCalled();
    });

    it("Harus gagal (422) jika validasi Joi tidak terpenuhi (Body kosong/kurang)", async () => {
      const invalidPayload = { bio: "Terlalu pendek" }; 

      const res = await request(app)
        .post("/api/v1/mentor")
        .send(invalidPayload);

      expect(res.statusCode).toEqual(422); 
      expect(MentorService.create).not.toHaveBeenCalled();
    });
  });

  // =======================================================
  // UPDATE MENTOR
  // =======================================================
  describe("PATCH /api/v1/mentor/:id", () => {
    it("Harus berhasil update mentor (200)", async () => {
      const updatePayload = { status: "ACCEPTED" };
      const mockUpdatedData = { id: "mentor-1", ...updatePayload };
      
      MentorService.update.mockResolvedValue(mockUpdatedData);

      const res = await request(app)
        .patch("/api/v1/mentor/mentor-1")
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.status).toBe("ACCEPTED");
      expect(MentorService.update).toHaveBeenCalledWith("mentor-1", updatePayload, expect.anything());
    });
  });

  // =======================================================
  // DELETE MENTOR
  // =======================================================
  describe("DELETE /api/v1/mentor/:id", () => {
    it("Harus berhasil menghapus mentor (200)", async () => {
      const mockDeleteResponse = {
        data: { id: "mentor-1" },
        message: "Mentor permanently deleted.",
      };
      
      MentorService.delete.mockResolvedValue(mockDeleteResponse);

      const res = await request(app).delete("/api/v1/mentor/mentor-1");

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Mentor permanently deleted.");
      expect(MentorService.delete).toHaveBeenCalledWith("mentor-1", expect.anything());
    });
  });
});