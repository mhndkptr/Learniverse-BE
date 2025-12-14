import BaseRoutes from "../../../base-classes/base-routes.js";
import {
  createUserSchema,
  updateUserSchema,
  getAllUserParamsSchema,
} from "./user.schema.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import userController from "./user-controller.js";
import Role from "../../../common/enums/role-enum.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import uploadFile from "../../../middlewares/upload-file-middleware.js";

class UserRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      validateQueryParamsCredentials(getAllUserParamsSchema),
      tryCatch(userController.getAll),
    ]);
    this.router.get("/:id", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      tryCatch(userController.getById),
    ]);

    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      validateCredentials(createUserSchema),
      tryCatch(userController.create)
    );

    this.router.patch(
      "/:id",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN, Role.STUDENT]),
      uploadFile("image").single("profile_uri"),
      validateCredentials(updateUserSchema),
      tryCatch(userController.update)
    );

    this.router.delete(
      "/:id",
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      tryCatch(userController.remove)
    );
  }
}

export default new UserRoutes().router;
