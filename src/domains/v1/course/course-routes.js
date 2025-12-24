import BaseRoutes from "../../../base-classes/base-routes.js";
import Role from "../../../common/enums/role-enum.js";
import authMiddleware from "../../../middlewares/auth-token-middleware.js";
import uploadFile from "../../../middlewares/upload-file-middleware.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import CourseController from "./course-controller.js";
import {
  createCourseSchema,
  updateCourseSchema,
  getAllCourseParamsSchema,
} from "./course-schema.js";

class CourseRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      validateQueryParamsCredentials(getAllCourseParamsSchema),
      tryCatch(CourseController.getAll),
    ]);

    this.router.get("/me", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles([Role.STUDENT]),
      tryCatch(CourseController.getAllMe),
    ]);

    this.router.get("/:id/dashboard", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles([Role.ADMIN, Role.STUDENT]),
      tryCatch(CourseController.getByIdForUser),
    ]);

    this.router.get("/:id", [tryCatch(CourseController.getById)]);

    this.router.post("/", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles(["ADMIN"]),
      uploadFile("image").single("image_cover"),
      validateCredentials(createCourseSchema),
      tryCatch(CourseController.create),
    ]);

    this.router.patch("/:id", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles(["ADMIN"]),
      uploadFile("image").single("image_cover"),
      validateCredentials(updateCourseSchema),
      tryCatch(CourseController.update),
    ]);

    this.router.delete("/:id", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles(["ADMIN"]),
      tryCatch(CourseController.delete),
    ]);
  }
}

export default new CourseRoutes().router;
