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

await jest.unstable_mockModule("./auth-service.js", () => ({
  default: {
    register: jest.fn(),
    login: jest.fn(),
    refreshToken: jest.fn(),
    getProfile: jest.fn(),
  },
}));

const { default: AuthService } = await import("./auth-service.js");
const { default: app } = await import("../../../app.js");

describe("Auth Endpoints", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockAuthenticate.mockImplementation((req, res, next) => {
      req.user = { id: 1, role: "STUDENT" };
      next();
    });
  });

  describe("POST /api/v1/auth/register", () => {
    it("Harus berhasil register (200) dengan data valid dan file", async () => {
      const mockUserResponse = {
        user: { id: 1, name: "Test User", email: "test@mail.com" },
      };
      AuthService.register.mockResolvedValue(mockUserResponse);

      const res = await request(app)
        .post("/api/v1/auth/register")
        .field("name", "Test User")
        .field("username", "testuser")
        .field("email", "test@mail.com")
        .field("phone_number", "08123456789")
        .field("password", "Password123!")
        .field("password_confirmation", "Password123!")
        .attach("image_profile", Buffer.from("dummy-image"), "test.jpg");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data).toEqual(mockUserResponse.user);
    });

    it("Harus gagal (422) jika validasi Joi tidak terpenuhi", async () => {
      const res = await request(app)
        .post("/api/v1/auth/register")
        .field("email", "not-an-email")
        .field("password", "123");

      expect(res.statusCode).toEqual(422);
      expect(AuthService.register).not.toHaveBeenCalled();
    });
  });

  describe("POST /api/v1/auth/login", () => {
    it("Harus berhasil login (200)", async () => {
      const mockResponse = {
        access_token: "ACCESS",
        refresh_token: "REFRESH",
        user: { id: 1, email: "test@mail.com" },
      };
      AuthService.login.mockResolvedValue(mockResponse);

      const res = await request(app).post("/api/v1/auth/login").send({
        email: "test@mail.com",
        password: "Pass",
      });

      expect(res.statusCode).toEqual(200);
    });
  });

  describe("POST /api/v1/auth/refresh-token", () => {
    it("Harus mengembalikan access token baru jika cookie ada", async () => {
      AuthService.refreshToken.mockResolvedValue({
        access_token: "NEW_ACCESS_TOKEN",
      });

      const res = await request(app)
        .post("/api/v1/auth/refresh-token")
        .set("Cookie", ["refresh_token=VALID_REFRESH_TOKEN"]);

      expect(res.statusCode).toEqual(200);
      expect(res.headers["authorization"]).toBe("Bearer NEW_ACCESS_TOKEN");
    });

    it("Harus gagal (401) jika refresh token tidak ada di cookie", async () => {
      const res = await request(app).post("/api/v1/auth/refresh-token");
      expect(res.statusCode).toEqual(401);
    });
  });

  describe("GET /api/v1/auth/me", () => {
    it("Harus berhasil mendapatkan profile (Middleware di-bypass)", async () => {
      AuthService.getProfile.mockResolvedValue({ id: 1, name: "Budi" });

      const res = await request(app).get("/api/v1/auth/me");

      expect(res.statusCode).toEqual(200);
      expect(res.body.data.name).toBe("Budi");
      expect(AuthService.getProfile).toHaveBeenCalledWith(1);
    });

    it("Harus gagal (401) jika token tidak valid (Simulasi Error Middleware)", async () => {
      mockAuthenticate.mockImplementationOnce((req, res, next) => {
        res.status(401).json({
          code: 401,
          status: "UNAUTHORIZED",
          message: "Token Is Invalid Or No Longer Valid",
        });
      });

      const res = await request(app).get("/api/v1/auth/me");

      expect(res.statusCode).toEqual(401);
      expect(AuthService.getProfile).not.toHaveBeenCalled();
    });
  });
});
