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
const mockGetAllForStudent = jest.fn();
const mockGetById = jest.fn();
const mockCreate = jest.fn();
const mockUpdate = jest.fn();
const mockDelete = jest.fn();

await jest.unstable_mockModule("./quiz-service.js", () => ({
  default: {
    getAll: mockGetAll,
    getAllForStudent: mockGetAllForStudent,
    getById: mockGetById,
    create: mockCreate,
    update: mockUpdate,
    delete: mockDelete,
  },
}));

const { default: QuizService } = await import("./quiz-service.js");
const { default: app } = await import("../../../app.js");

describe("Quiz Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: "STUDENT" };
      next();
    });
  });

  it("GET /api/v1/quiz should return all quizzes (200)", async () => {
    const mockData = { data: [{ id: "q1" }], meta: { totalItems: 1 } };
    mockGetAll.mockResolvedValue(mockData);

    const res = await request(app).get("/api/v1/quiz");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(mockData.data);
    expect(res.body.pagination).toEqual(mockData.meta);
  });

  it("GET /api/v1/quiz/me/active should return active quizzes for student (200)", async () => {
    const mockData = { data: [{ id: "q-active" }], meta: { totalItems: 1 } };
    mockGetAllForStudent.mockResolvedValue(mockData);

    const res = await request(app).get("/api/v1/quiz/me/active");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(mockData.data);
    expect(res.body.pagination).toEqual(mockData.meta);
  });

  it("GET /api/v1/quiz/:id should return quiz by id (200)", async () => {
    const quiz = { id: "q1", title: "Quiz 1" };
    mockGetById.mockResolvedValue(quiz);

    const res = await request(app).get("/api/v1/quiz/q1");

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(quiz);
  });

  it("POST /api/v1/quiz should create quiz (201)", async () => {
    const created = { id: "created" };
    mockCreate.mockResolvedValue(created);

    const res = await request(app).post("/api/v1/quiz").send({ title: "New" });

    expect(res.statusCode).toEqual(201);
    expect(res.body.data).toEqual(created);
  });

  it("PATCH /api/v1/quiz/:id should update quiz (200)", async () => {
    const updated = { id: "u1", title: "Updated" };
    mockUpdate.mockResolvedValue(updated);

    const res = await request(app).patch("/api/v1/quiz/u1").send({ title: "Updated" });

    expect(res.statusCode).toEqual(200);
    expect(res.body.data).toEqual(updated);
  });

  it("DELETE /api/v1/quiz/:id should delete quiz (200)", async () => {
    mockDelete.mockResolvedValue({ data: null, message: "Deleted" });

    const res = await request(app).delete("/api/v1/quiz/del");

    expect(res.statusCode).toEqual(200);
  });
});
