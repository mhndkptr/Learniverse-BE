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
  "./quiz-attempt-question-answer-service.js",
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

const { default: Service } = await import("./quiz-attempt-question-answer-service.js");
const { default: app } = await import("../../../../app.js");

describe("Quiz Attempt Question Answer Endpoints", () => {
  beforeEach(() => jest.clearAllMocks());

  it("GET /api/v1/quiz/attemptQuestionAnswer should return items (200)", async () => {
    const mockData = { data: [{ id: "a1" }], meta: { totalItems: 1 } };
    Service.getAll.mockResolvedValue(mockData);

    const res = await request(app).get("/api/v1/quiz/attemptQuestionAnswer");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(mockData.data);
    expect(res.body.pagination).toEqual(mockData.meta);
  });

  it("GET /api/v1/quiz/attemptQuestionAnswer/:id should return item (200)", async () => {
    const item = { id: "550e8400-e29b-41d4-a716-446655440020" };
    Service.getById.mockResolvedValue(item);

    const res = await request(app).get("/api/v1/quiz/attemptQuestionAnswer/550e8400-e29b-41d4-a716-446655440020");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(item);
  });

  it("POST /api/v1/quiz/attemptQuestionAnswer should create item (201)", async () => {
    const created = { id: "c1" };
    Service.create.mockResolvedValue(created);

    const res = await request(app).post("/api/v1/quiz/attemptQuestionAnswer").send({});

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toEqual(created);
  });

  it("PATCH /api/v1/quiz/attemptQuestionAnswer/:id should update item (200)", async () => {
    const updated = { id: "550e8400-e29b-41d4-a716-446655440021" };
    Service.update.mockResolvedValue(updated);

    const res = await request(app).patch("/api/v1/quiz/attemptQuestionAnswer/550e8400-e29b-41d4-a716-446655440021").send({});

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(updated);
  });

  it("DELETE /api/v1/quiz/attemptQuestionAnswer/:id should delete item (200)", async () => {
    Service.delete.mockResolvedValue({ data: null, message: "Deleted" });

    const res = await request(app).delete("/api/v1/quiz/attemptQuestionAnswer/550e8400-e29b-41d4-a716-446655440022");

    expect(res.statusCode).toEqual(200);
  });
});
