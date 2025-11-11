import BaseRoutes from "../../../base-classes/base-routes.js";
import authMiddleware from "../../../middlewares/auth-token-middleware.js";
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

    this.router.get("/:id", [tryCatch(CourseController.getById)]);

    this.router.post("/", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles(["ADMIN"]),
      validateCredentials(createCourseSchema),
      tryCatch(CourseController.create),
    ]);


    this.router.patch("/:id", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles(["ADMIN"]),
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
