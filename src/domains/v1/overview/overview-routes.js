import BaseRoutes from "../../../base-classes/base-routes.js";
import Role from "../../../common/enums/role-enum.js";
import authMiddleware from "../../../middlewares/auth-token-middleware.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import OverviewController from "./overview-controller.js";
import { overviewQuerySchema } from "./overview-schema.js";

class OverviewRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authMiddleware.authenticate,
      authMiddleware.authorizeRoles([Role.ADMIN]),
      validateQueryParamsCredentials(overviewQuerySchema),
      tryCatch(OverviewController.getOverview),
    ]);
  }
}

export default new OverviewRoutes().router;
