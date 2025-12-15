import { jest } from "@jest/globals";
import request from "supertest";
import BaseError from "../../../base-classes/base-error.js";
import { randomUUID } from "crypto";

// =======================================================
// 1. SETUP MOCKS
// =======================================================

// Mock Middleware Auth
const mockAuthenticate = jest.fn((req, res, next) => {
  // Default user ADMIN agar bisa bypass validasi role di service (jika service dipanggil)
  req.user = { id: "admin-uuid", role: "ADMIN" };
  next();
});

const mockAuthorizeRoles = jest.fn((roles) => {
  return (req, res, next) => next();
});

// Mock Module Middleware
await jest.unstable_mockModule(
  "../../../middlewares/auth-token-middleware.js",
  () => ({
    default: {
      authenticate: mockAuthenticate,
      authorizeRoles: mockAuthorizeRoles,
    },
  })
);

// Mock Schedule Service (Agar tidak connect ke Database)
await jest.unstable_mockModule("./schedule-service.js", () => ({
  default: {
    getAll: jest.fn(),
    getById: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}));

// =======================================================
// 2. IMPORT MODULES (Dynamic Import setelah Mock)
// =======================================================
const { default: ScheduleService } = await import("./schedule-service.js");
const { default: app } = await import("../../../app.js");

// =======================================================
// 3. TEST SUITE
// =======================================================
describe("Schedule Endpoints", () => {
  // Helper UUID valid untuk course_id
  const validCourseId = randomUUID();
  
  beforeEach(() => {
    jest.clearAllMocks();

    // Reset default behavior middleware
    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: "admin-uuid", role: "ADMIN" };
      next();
    });
  });

  // -------------------------------------------------------
  // GET ALL SCHEDULES
  // -------------------------------------------------------
  describe("GET /api/v1/schedule", () => {
    it("Harus berhasil mengambil data schedule (200)", async () => {
      const mockResult = {
        data: [
          {
            id: "schedule-1",
            title: "Belajar Backend",
            start_time: new Date().toISOString(),
            end_time: new Date().toISOString(),
            course_id: validCourseId
          },
        ],
        meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
      };

      ScheduleService.getAll.mockResolvedValue(mockResult);

      const res = await request(app).get("/api/v1/schedule");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].title).toBe("Belajar Backend");
      expect(ScheduleService.getAll).toHaveBeenCalled();
    });

    it("Harus gagal (401) jika token invalid (Simulasi Error Middleware)", async () => {
      mockAuthenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({
          code: 401,
          status: "UNAUTHORIZED",
          message: "Token Is Invalid",
        });
      });

      const res = await request(app).get("/api/v1/schedule");

      expect(res.statusCode).toEqual(401);
      expect(ScheduleService.getAll).not.toHaveBeenCalled();
    });
  });

  // -------------------------------------------------------
  // GET SCHEDULE BY ID
  // -------------------------------------------------------
  describe("GET /api/v1/schedule/:id", () => {
    it("Harus berhasil mengambil detail schedule (200)", async () => {
      const mockSchedule = { id: "schedule-1", title: "Detail Jadwal" };
      ScheduleService.getById.mockResolvedValue(mockSchedule);

      const res = await request(app).get("/api/v1/schedule/schedule-1");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.id).toBe("schedule-1");
      expect(ScheduleService.getById).toHaveBeenCalledWith("schedule-1");
    });

    it("Harus gagal (404) jika schedule tidak ditemukan", async () => {
      ScheduleService.getById.mockRejectedValue(BaseError.notFound("Schedule not found"));

      const res = await request(app).get("/api/v1/schedule/invalid-id");

      expect(res.statusCode).toEqual(404);
      expect(res.body.message).toBe("Schedule not found");
    });
  });

  // -------------------------------------------------------
  // CREATE SCHEDULE
  // -------------------------------------------------------
  describe("POST /api/v1/schedule", () => {
    const validPayload = {
      title: "Live Session Prisma",
      description: "Membahas relasi database.",
      start_time: "2025-12-20T09:00:00.000Z", // Format ISO 8601
      end_time: "2025-12-20T11:00:00.000Z",
      course_id: validCourseId,
    };

    it("Harus berhasil membuat schedule (201) dengan data valid", async () => {
      const mockCreated = { ...validPayload, id: "new-schedule-id" };
      ScheduleService.create.mockResolvedValue(mockCreated);

      const res = await request(app)
        .post("/api/v1/schedule")
        .send(validPayload);
      
      // Debugging optional jika error
      // if (res.statusCode !== 201) console.log(JSON.stringify(res.body, null, 2));

      expect(res.statusCode).toEqual(201);
      expect(res.body.data.title).toBe(validPayload.title);
      expect(ScheduleService.create).toHaveBeenCalled();
    });

    it("Harus gagal (422) jika validasi Joi tidak terpenuhi (Misal tanpa title)", async () => {
      const invalidPayload = {
        description: "Lupa judul",
        start_time: "2025-12-20T09:00:00.000Z",
        end_time: "2025-12-20T11:00:00.000Z",
        course_id: validCourseId,
      };

      const res = await request(app)
        .post("/api/v1/schedule")
        .send(invalidPayload);

      expect(res.statusCode).toEqual(422);
      expect(ScheduleService.create).not.toHaveBeenCalled();
    });

    it("Harus gagal (422) jika format tanggal salah", async () => {
      const invalidDatePayload = {
        ...validPayload,
        start_time: "Besok Pagi", // Bukan ISO Date
      };

      const res = await request(app)
        .post("/api/v1/schedule")
        .send(invalidDatePayload);

      expect(res.statusCode).toEqual(422);
    });
  });

  // -------------------------------------------------------
  // UPDATE SCHEDULE
  // -------------------------------------------------------
  describe("PATCH /api/v1/schedule/:id", () => {
    it("Harus berhasil update schedule (200)", async () => {
      const updatePayload = { title: "Reschedule: Live Session" };
      const mockUpdated = { id: "schedule-1", ...updatePayload };

      ScheduleService.update.mockResolvedValue(mockUpdated);

      const res = await request(app)
        .patch("/api/v1/schedule/schedule-1")
        .send(updatePayload);

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.title).toBe("Reschedule: Live Session");
      expect(ScheduleService.update).toHaveBeenCalledWith("schedule-1", updatePayload, expect.anything());
    });

    it("Harus gagal (404) jika schedule yang mau diupdate tidak ada", async () => {
      ScheduleService.update.mockRejectedValue(BaseError.notFound("Schedule not found"));

      const res = await request(app)
        .patch("/api/v1/schedule/unknown-id")
        .send({ title: "Test" });

      expect(res.statusCode).toEqual(404);
    });
  });

  // -------------------------------------------------------
  // DELETE SCHEDULE
  // -------------------------------------------------------
  describe("DELETE /api/v1/schedule/:id", () => {
    it("Harus berhasil menghapus schedule (200)", async () => {
      const mockDeleteResponse = {
        data: { id: "schedule-1" },
        message: "Schedule permanently deleted",
      };

      ScheduleService.delete.mockResolvedValue(mockDeleteResponse);

      const res = await request(app).delete("/api/v1/schedule/schedule-1");

      expect(res.statusCode).toEqual(200);
      expect(res.body.message).toBe("Schedule permanently deleted");
      expect(ScheduleService.delete).toHaveBeenCalledWith("schedule-1", expect.anything());
    });

    it("Harus gagal (404) jika schedule tidak ditemukan", async () => {
      ScheduleService.delete.mockRejectedValue(BaseError.notFound("Schedule not found"));

      const res = await request(app).delete("/api/v1/schedule/unknown-id");

      expect(res.statusCode).toEqual(404);
    });
  });
});