import BaseRoutes from "../../../base-classes/base-routes.js";
import {
  createMentorSchema,
  updateMentorSchema,
  getAllMentorParamsSchema,
} from "./mentor-schema.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import mentorController from "./mentor-controller.js";
import Role from "../../../common/enums/role-enum.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";

class MentorRoutes extends BaseRoutes {
  routes() {
    // =======================================================
    // GET ALL mentors
    // =======================================================
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      validateQueryParamsCredentials(getAllMentorParamsSchema),
      tryCatch(mentorController.getAll),
    ]);

    // =======================================================
    // GET mentor by ID
    // =======================================================
    this.router.get("/:id", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      tryCatch(mentorController.getById),
    ]);

    // =======================================================
    // CREATE mentor
    // =======================================================
    this.router.post("/", [
      authTokenMiddleware.authenticate,
      // Hanya admin dan user biasa (calon mentor) yang boleh mendaftar
      authTokenMiddleware.authorizeRoles([Role.ADMIN, Role.STUDENT]),
      validateCredentials(createMentorSchema),
      tryCatch(mentorController.create),
    ]);

    // =======================================================
    // UPDATE mentor
    // =======================================================
    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN, Role.STUDENT]),
      validateCredentials(updateMentorSchema),
      tryCatch(mentorController.update),
    ]);

    // =======================================================
    // DELETE mentor
    // =======================================================
    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.ADMIN]),
      tryCatch(mentorController.delete),
    ]);
  }
}

export default new MentorRoutes().router;
