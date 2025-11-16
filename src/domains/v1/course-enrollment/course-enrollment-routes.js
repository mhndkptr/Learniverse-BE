import BaseRoutes from "../../../base-classes/base-routes.js";
import Role from "../../../common/enums/role-enum.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import courseEnrollmentController from "./course-enrollment-controller.js";
import { createCourseEnrollmentSchema } from "./course-enrollment-schema.js";

class CourseEnrollmentRoutes extends BaseRoutes {
  routes() {
    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      validateCredentials(createCourseEnrollmentSchema),
      tryCatch(courseEnrollmentController.create)
    );
  }
}

export default new CourseEnrollmentRoutes().router;
