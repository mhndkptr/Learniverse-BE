import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

const mockCourseTransactionService = {
  getAll: jest.fn(),
  create: jest.fn(),
  notify: jest.fn(),
};

jest.mock("./course-transaction-service.js", () => ({
  __esModule: true,
  default: mockCourseTransactionService,
}));

jest.mock("../../../../utils/response.js", () => ({
  successResponse: jest.fn(),
  createdResponse: jest.fn(),
}));

let CourseTransactionController;
let successResponse;
let createdResponse;

beforeAll(async () => {
  ({ default: CourseTransactionController } = await import(
    "./course-transaction-controller.js"
  ));
  ({ successResponse, createdResponse } = await import(
    "../../../../utils/response.js"
  ));
});

describe("CourseTransactionController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mengambil daftar transaksi dengan query tervalidasi", async () => {
    const req = {
      validatedQuery: { pagination: { page: 1, limit: 10 } },
      user: { id: "user-1" },
    };
    const res = {};
    const serviceResult = {
      data: [{ id: "transaction-1" }],
      meta: { totalItems: 1 },
    };
    mockCourseTransactionService.getAll.mockResolvedValue(serviceResult);

    await CourseTransactionController.getAll(req, res);

    expect(mockCourseTransactionService.getAll).toHaveBeenCalledWith(
      req.validatedQuery,
      req.user
    );
    expect(successResponse).toHaveBeenCalledWith(
      res,
      serviceResult.data,
      "Course transactions retrieved successfully",
      serviceResult.meta
    );
  });

  it("melempar error saat create tanpa body", async () => {
    const req = { body: undefined };

    await expect(CourseTransactionController.create(req, {})).rejects.toThrow(
      "Request body is missing"
    );
    expect(mockCourseTransactionService.create).not.toHaveBeenCalled();
  });

  it("meneruskan payload ke service saat create berhasil", async () => {
    const req = { body: { course_id: "course-1", user_id: "user-1" } };
    const res = {};
    const serviceResult = {
      courseTransaction: { id: "transaction-1" },
    };
    mockCourseTransactionService.create.mockResolvedValue(serviceResult);

    await CourseTransactionController.create(req, res);

    expect(mockCourseTransactionService.create).toHaveBeenCalledWith(req.body);
    expect(createdResponse).toHaveBeenCalledWith(
      res,
      serviceResult.courseTransaction,
      "Course transaction created successfully"
    );
  });

  it("melempar error saat notify tanpa body", async () => {
    const req = { body: undefined };

    await expect(CourseTransactionController.notify(req, {})).rejects.toThrow(
      "Request body is missing"
    );
    expect(mockCourseTransactionService.notify).not.toHaveBeenCalled();
  });

  it("meneruskan payload ke service saat notify berhasil", async () => {
    const req = { body: { order_id: "transaction-2" } };
    const res = {};
    mockCourseTransactionService.notify.mockResolvedValue(undefined);

    await CourseTransactionController.notify(req, res);

    expect(mockCourseTransactionService.notify).toHaveBeenCalledWith(req.body);
    expect(successResponse).toHaveBeenCalledWith(
      res,
      null,
      "Course transaction notification processed successfully"
    );
  });
});
