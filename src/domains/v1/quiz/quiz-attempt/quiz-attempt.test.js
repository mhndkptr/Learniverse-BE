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
  "./quiz-attempt-service.js",
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

const { default: QuizAttemptService } = await import("./quiz-attempt-service.js");
const { default: app } = await import("../../../../app.js");

describe("Quiz Attempt Endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET /api/v1/quiz/attempt should return attempts (200)", async () => {
    const mockData = { data: [{ id: "qa1" }], meta: { totalItems: 1 } };
    QuizAttemptService.getAll.mockResolvedValue(mockData);

    const res = await request(app).get("/api/v1/quiz/attempt");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(mockData.data);
    expect(res.body.pagination).toEqual(mockData.meta);
  });

  it("GET /api/v1/quiz/attempt/:id should return attempt (200)", async () => {
    const item = { id: "qa1" };
    QuizAttemptService.getById.mockResolvedValue(item);

    const res = await request(app).get("/api/v1/quiz/attempt/qa1");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(item);
  });

  it("POST /api/v1/quiz/attempt should create attempt (201)", async () => {
    const created = { id: "c1" };
    QuizAttemptService.create.mockResolvedValue(created);

    const res = await request(app).post("/api/v1/quiz/attempt").send({ quiz_id: "q1" });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toEqual(created);
  });

  it("PATCH /api/v1/quiz/attempt/:id should update attempt (200)", async () => {
    const updated = { id: "u1" };
    QuizAttemptService.update.mockResolvedValue(updated);

    const res = await request(app).patch("/api/v1/quiz/attempt/u1").send({ score: 90 });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(updated);
  });

  it("DELETE /api/v1/quiz/attempt/:id should delete attempt (200)", async () => {
    QuizAttemptService.delete.mockResolvedValue({ data: null, message: "Deleted" });

    const res = await request(app).delete("/api/v1/quiz/attempt/del");

    expect(res.statusCode).toEqual(200);
  });
});
