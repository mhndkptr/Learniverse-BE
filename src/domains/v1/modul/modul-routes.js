import BaseRoutes from "../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import uploadFile from "../../../middlewares/upload-file-middleware.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import modulController from "./modul-controller.js";
import {
  createModulSchema,
  updateModulSchema,
  getAllModulParamsSchema,
} from "./modul-schema.js";

class ModulRoutes extends BaseRoutes {
  routes() {
    this.router.get(
      "/",
      validateQueryParamsCredentials(getAllModulParamsSchema),
      authTokenMiddleware.authenticate,
      tryCatch(modulController.getAll)
    );

    this.router.get(
      "/:id",
      authTokenMiddleware.authenticate,
      tryCatch(modulController.getById)
    );

    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      uploadFile("document").single("file_module"),
      validateCredentials(createModulSchema),
      tryCatch(modulController.create)
    );

    this.router.put(
      "/:id",
      authTokenMiddleware.authenticate,
      uploadFile("document").single("file_module"),
      validateCredentials(updateModulSchema),
      tryCatch(modulController.update)
    );

    this.router.delete(
      "/:id",
      authTokenMiddleware.authenticate,
      tryCatch(modulController.remove)
    );
  }
}

export default new ModulRoutes().router;
