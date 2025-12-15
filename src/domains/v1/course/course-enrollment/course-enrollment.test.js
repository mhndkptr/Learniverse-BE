import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

const mockCourseEnrollmentService = {
  getAll: jest.fn(),
  create: jest.fn(),
};

jest.mock("./course-enrollment-service.js", () => ({
  __esModule: true,
  default: mockCourseEnrollmentService,
}));

jest.mock("../../../../utils/response.js", () => ({
  successResponse: jest.fn(),
  createdResponse: jest.fn(),
}));

let CourseEnrollmentController;
let successResponse;
let createdResponse;

beforeAll(async () => {
  ({ default: CourseEnrollmentController } = await import(
    "./course-enrollment-controller.js"
  ));
  ({ successResponse, createdResponse } = await import(
    "../../../../utils/response.js"
  ));
});

describe("CourseEnrollmentController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("mengambil daftar enrollments dengan parameter query tervalidasi", async () => {
    const req = {
      validatedQuery: { pagination: { page: 1, limit: 10 } },
      user: { id: "user-1" },
    };
    const res = {};
    const serviceResult = {
      data: [{ id: "enroll-1" }],
      meta: { totalItems: 1 },
    };
    mockCourseEnrollmentService.getAll.mockResolvedValue(serviceResult);

    await CourseEnrollmentController.getAll(req, res);

    expect(mockCourseEnrollmentService.getAll).toHaveBeenCalledWith(
      req.validatedQuery,
      req.user
    );
    expect(successResponse).toHaveBeenCalledWith(
      res,
      serviceResult.data,
      "Course enrollments retrieved successfully",
      serviceResult.meta
    );
  });

  it("melempar error saat create tanpa body", async () => {
    const req = { body: undefined };

    await expect(CourseEnrollmentController.create(req, {})).rejects.toThrow(
      "Request body is missing"
    );
    expect(mockCourseEnrollmentService.create).not.toHaveBeenCalled();
  });

  it("meneruskan payload ke CourseEnrollmentService.create dan mengembalikan response berhasil", async () => {
    const req = {
      body: { course_id: "course-1", user_id: "user-2" },
    };
    const res = {};
    const serviceResult = {
      courseEnrollment: { id: "enroll-abc" },
    };
    mockCourseEnrollmentService.create.mockResolvedValue(serviceResult);

    await CourseEnrollmentController.create(req, res);

    expect(mockCourseEnrollmentService.create).toHaveBeenCalledWith(req.body);
    expect(createdResponse).toHaveBeenCalledWith(
      res,
      serviceResult.courseEnrollment,
      "Enrollment created successfully"
    );
  });
});
