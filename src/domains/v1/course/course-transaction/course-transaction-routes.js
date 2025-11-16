import BaseRoutes from "../../../../base-classes/base-routes.js";
import Role from "../../../../common/enums/role-enum.js";
import authTokenMiddleware from "../../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../../middlewares/validate-credentials-middleware.js";
import tryCatch from "../../../../utils/tryCatcher.js";
import courseTransactionController from "./course-transaction-controller.js";
import { createCourseTransactionSchema } from "./course-transaction-schema.js";

class CourseTransactionRoutes extends BaseRoutes {
  routes() {
    this.router.get(
      "/",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      tryCatch(courseTransactionController.getAll)
    );

    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.STUDENT]),
      validateCredentials(createCourseTransactionSchema),
      tryCatch(courseTransactionController.create)
    );

    this.router.post("/notify", tryCatch(courseTransactionController.notify));
  }
}

export default new CourseTransactionRoutes().router;
