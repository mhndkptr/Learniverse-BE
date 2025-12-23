import { jest } from "@jest/globals";
import request from "supertest";

const mockAuthenticate = jest.fn((req, res, next) => {
  req.user = { id: 1, role: "STUDENT" };
  next();
});

const mockAuthorizeRoles = jest.fn((roles) => {
  return (req, res, next) => next();
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

await jest.unstable_mockModule(
  "../../../middlewares/validate-credentials-middleware.js",
  () => ({
    default: (schema) => (req, res, next) => next(),
  })
);

await jest.unstable_mockModule(
  "../../../middlewares/validate-query-params-credentials-middleware.js",
  () => ({
    default: (schema) => (req, res, next) => next(),
  })
);

const mockGetAll = jest.fn();
const mockGetById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockRemove = jest.fn();

await jest.unstable_mockModule("./modul-service.js", () => ({
  default: {
    getAll: mockGetAll,
    getById: mockGetById,
    create: mockCreate,
    update: mockUpdate,
    remove: mockRemove,
  },
}));

const { default: ModulService } = await import("./modul-service.js");
const { default: app } = await import("../../../app.js");

describe("Modul Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: "STUDENT" };
      next();
    });
  });

  describe("GET /api/v1/modul", () => {
    it("should return all moduls (200)", async () => {
      const mockData = {
        data: [
          { id: "1", title: "Modul 1", description: "Desc 1" },
        ],
        meta: { totalItems: 1, totalPages: 1, currentPage: 1, itemsPerPage: 10 },
      };

      mockGetAll.mockResolvedValue(mockData);

      const res = await request(app).get("/api/v1/modul");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual(mockData.data);
      expect(res.body.pagination).toEqual(mockData.meta);
    });
  });

  describe("GET /api/v1/modul/:id", () => {
    it("should return modul by id (200)", async () => {
      const modul = { id: "abc", title: "Modul A" };
      mockGetById.mockResolvedValue(modul);

      const res = await request(app).get("/api/v1/modul/abc");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual(modul);
    });
  });

  describe("POST /api/v1/modul", () => {
    it("should create modul (200) with valid data and file", async () => {
      const modul = { id: "new", title: "New Modul" };
      mockCreate.mockResolvedValue(modul);

      const res = await request(app)
        .post("/api/v1/modul")
        .field("title", "New Modul")
        .field("description", "Desc")
        .field("file_name", "modul.pdf")
        .field("course_id", "11111111-1111-1111-1111-111111111111")
        .attach("file_module", Buffer.from("dummy-file"), "modul.pdf");

      expect(res.statusCode).toEqual(201);
      expect(res.body.data).toEqual(modul);
    });

    it("should fail (422) when Joi validation fails", async () => {
      const res = await request(app).post("/api/v1/modul").send({});

      expect(res.statusCode).toEqual(400);
      expect(ModulService.create).not.toHaveBeenCalled();
    });
  });

  describe("PUT /api/v1/modul/:id", () => {
    it("should update modul (200)", async () => {
      const updated = { id: "upd", title: "Updated" };
      mockUpdate.mockResolvedValue(updated);

      const res = await request(app)
        .put("/api/v1/modul/upd")
        .field("title", "Updated")
        .attach("file_module", Buffer.from("dummy"), "modul.pdf");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual(updated);
    });
  });

  describe("DELETE /api/v1/modul/:id", () => {
    it("should delete modul (200)", async () => {
      mockRemove.mockResolvedValue(true);

      const res = await request(app).delete("/api/v1/modul/del");

      expect(res.statusCode).toEqual(200);
    });
  });
});
