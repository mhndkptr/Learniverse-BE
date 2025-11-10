import BaseRoutes from "../../../base-classes/base-routes.js";
import { createScheduleSchema, updateScheduleSchema } from "./schedule-schema.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import scheduleController from "./schedule-controller.js";

class ScheduleRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", tryCatch(scheduleController.getAll));
    this.router.get("/:id", tryCatch(scheduleController.getById));

    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      validateCredentials(createScheduleSchema),
      tryCatch(scheduleController.create)
    );

    this.router.put(
      "/:id",
      authTokenMiddleware.authenticate,
      validateCredentials(updateScheduleSchema),
      tryCatch(scheduleController.update)
    );

    this.router.delete(
      "/:id",
      authTokenMiddleware.authenticate,
      tryCatch(scheduleController.remove)
    );
  }
}

export default new ScheduleRoutes().router;
