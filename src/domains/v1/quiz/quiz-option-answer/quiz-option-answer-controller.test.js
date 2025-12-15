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
  "../../../../middlewares/auth-token-middleware.js",
  () => ({
    default: {
      authenticate: mockAuthenticate,
      authorizeRoles: mockAuthorizeRoles,
    },
  })
);

await jest.unstable_mockModule(
  "../../../../middlewares/validate-credentials-middleware.js",
  () => ({
    default: (schema) => (req, res, next) => next(),
  })
);

await jest.unstable_mockModule(
  "../../../../middlewares/validate-query-params-credentials-middleware.js",
  () => ({
    default: (schema) => (req, res, next) => next(),
  })
);

await jest.unstable_mockModule(
  "../../../../middlewares/upload-file-middleware.js",
  () => ({
    default: (type) => ({
      single: (field) => (req, res, next) => next(),
    }),
  })
);

await jest.unstable_mockModule(
  "./quiz-option-answer-service.js",
  () => ({
    default: {
      getAll: jest.fn(),
      getById: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  })
);

const { default: Service } = await import("./quiz-option-answer-service.js");
const { default: app } = await import("../../../../app.js");

describe("Quiz Option Answer Endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET /api/v1/quiz/optionAnswer should return items (200)", async () => {
    const mockData = { data: [{ id: "o1" }], meta: { totalItems: 1 } };
    Service.getAll.mockResolvedValue(mockData);

    const res = await request(app).get("/api/v1/quiz/optionAnswer");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(mockData.data);
    expect(res.body.pagination).toEqual(mockData.meta);
  });

  it("GET /api/v1/quiz/optionAnswer/:id should return item (200)", async () => {
    const item = { id: "550e8400-e29b-41d4-a716-446655440010" };
    Service.getById.mockResolvedValue(item);

    const res = await request(app).get("/api/v1/quiz/optionAnswer/550e8400-e29b-41d4-a716-446655440010");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(item);
  });

  it("POST /api/v1/quiz/optionAnswer should create item (201)", async () => {
    const created = { id: "c1" };
    Service.create.mockResolvedValue(created);

    const res = await request(app).post("/api/v1/quiz/optionAnswer").send({});

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toEqual(created);
  });

  it("PATCH /api/v1/quiz/optionAnswer/:id should update item (200)", async () => {
    const updated = { id: "550e8400-e29b-41d4-a716-446655440011" };
    Service.update.mockResolvedValue(updated);

    const res = await request(app).patch("/api/v1/quiz/optionAnswer/550e8400-e29b-41d4-a716-446655440011").send({});

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(updated);
  });

  it("DELETE /api/v1/quiz/optionAnswer/:id should delete item (200)", async () => {
    Service.delete.mockResolvedValue({ data: null, message: "Deleted" });

    const res = await request(app).delete("/api/v1/quiz/optionAnswer/550e8400-e29b-41d4-a716-446655440012");

    expect(res.statusCode).toEqual(200);
  });
});
