import {
  jest,
  describe,
  it,
  expect,
  beforeAll,
  beforeEach,
} from "@jest/globals";

const mockCourseService = {
  getAll: jest.fn(),
  getAllMe: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
};

jest.mock("./course-service.js", () => ({
  __esModule: true,
  default: mockCourseService,
}));

jest.mock("../../../utils/response.js", () => ({
  successResponse: jest.fn(),
  createdResponse: jest.fn(),
}));

let CourseController;
let successResponse;
let createdResponse;

beforeAll(async () => {
  ({ default: CourseController } = await import("./course-controller.js"));
  ({ successResponse, createdResponse } = await import(
    "../../../utils/response.js"
  ));
});

describe("CourseController", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("menggunakan query tervalidasi atau default objek kosong saat getAll", async () => {
    const req = {};
    const res = {};
    const serviceResult = {
      data: [{ id: "course-1" }],
      meta: { totalItems: 1 },
    };
    mockCourseService.getAll.mockResolvedValue(serviceResult);

    await CourseController.getAll(req, res);

    expect(mockCourseService.getAll).toHaveBeenCalledWith({});
    expect(successResponse).toHaveBeenCalledWith(
      res,
      serviceResult.data,
      "Courses retrieved successfully",
      serviceResult.meta
    );
  });

  it("mengoper query tervalidasi saat tersedia di getAll", async () => {
    const req = { validatedQuery: { pagination: { page: 2, limit: 5 } } };
    const res = {};
    const serviceResult = {
      data: [{ id: "course-2" }],
      meta: { totalItems: 5 },
    };
    mockCourseService.getAll.mockResolvedValue(serviceResult);

    await CourseController.getAll(req, res);

    expect(mockCourseService.getAll).toHaveBeenCalledWith(req.validatedQuery);
    expect(successResponse).toHaveBeenCalledWith(
      res,
      serviceResult.data,
      "Courses retrieved successfully",
      serviceResult.meta
    );
  });

  it("mengambil daftar course user melalui getAllMe", async () => {
    const req = { user: { id: "user-1" } };
    const res = {};
    const serviceResult = { data: [{ id: "course-a" }], meta: null };
    mockCourseService.getAllMe.mockResolvedValue(serviceResult);

    await CourseController.getAllMe(req, res);

    expect(mockCourseService.getAllMe).toHaveBeenCalledWith(req.user);
    expect(successResponse).toHaveBeenCalledWith(
      res,
      serviceResult.data,
      "Enrolled courses retrieved successfully",
      serviceResult.meta
    );
  });

  it("mengembalikan detail course melalui getById", async () => {
    const req = { params: { id: "course-3" } };
    const res = {};
    const course = { id: "course-3" };
    mockCourseService.getById.mockResolvedValue(course);

    await CourseController.getById(req, res);

    expect(mockCourseService.getById).toHaveBeenCalledWith("course-3");
    expect(successResponse).toHaveBeenCalledWith(
      res,
      course,
      "Course retrieved successfully"
    );
  });

  it("melempar error saat create tanpa body", async () => {
    const req = { body: null, file: { buffer: Buffer.from("x") } };

    await expect(CourseController.create(req, {})).rejects.toThrow(
      "Request body is missing"
    );
    expect(mockCourseService.create).not.toHaveBeenCalled();
  });

  it("melempar error saat create tanpa file gambar", async () => {
    const req = { body: { title: "Course" }, file: null };

    await expect(CourseController.create(req, {})).rejects.toThrow(
      "Image file is missing"
    );
    expect(mockCourseService.create).not.toHaveBeenCalled();
  });

  it("mengubah format payload sebelum meneruskan ke CourseService.create", async () => {
    const req = {
      body: {
        title: "Course",
        price: "200.5",
        is_open_registration_member: "true",
        is_open_registration_mentor: "false",
      },
      file: { buffer: Buffer.from("cover") },
      user: { id: "admin" },
    };
    const res = {};
    const created = { id: "course-new" };
    mockCourseService.create.mockResolvedValue(created);

    await CourseController.create(req, res);

    expect(mockCourseService.create).toHaveBeenCalledWith(
      {
        title: "Course",
        price: 200.5,
        is_open_registration_member: true,
        is_open_registration_mentor: false,
      },
      req.user,
      req.file
    );
    expect(createdResponse).toHaveBeenCalledWith(
      res,
      created,
      "Course created successfully"
    );
  });

  it("melempar error saat update tanpa body", async () => {
    const req = { params: { id: "course-4" }, body: null };

    await expect(CourseController.update(req, {})).rejects.toThrow(
      "Request body is missing"
    );
    expect(mockCourseService.update).not.toHaveBeenCalled();
  });

  it("mengonversi field opsional ketika update", async () => {
    const req = {
      params: { id: "course-5" },
      body: {
        title: "Updated",
        price: "150",
        is_open_registration_member: "false",
      },
      user: { id: "admin" },
      file: { buffer: Buffer.from("new") },
    };
    const res = {};
    const updated = { id: "course-5", title: "Updated" };
    mockCourseService.update.mockResolvedValue(updated);

    await CourseController.update(req, res);

    expect(mockCourseService.update).toHaveBeenCalledWith(
      "course-5",
      {
        title: "Updated",
        price: 150,
        is_open_registration_member: false,
      },
      req.user,
      req.file
    );
    expect(successResponse).toHaveBeenCalledWith(
      res,
      updated,
      "Course updated successfully"
    );
  });

  it("meneruskan data hasil delete ke successResponse", async () => {
    const req = { params: { id: "course-6" }, user: { id: "admin" } };
    const res = {};
    const deletionResult = {
      data: { id: "course-6" },
      message: "Course permanently deleted.",
    };
    mockCourseService.delete.mockResolvedValue(deletionResult);

    await CourseController.delete(req, res);

    expect(mockCourseService.delete).toHaveBeenCalledWith("course-6", req.user);
    expect(successResponse).toHaveBeenCalledWith(
      res,
      deletionResult.data,
      deletionResult.message
    );
  });
});
