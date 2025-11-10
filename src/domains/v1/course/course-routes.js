import BaseRoutes from "../../../base-classes/base-routes.js";
import multer from "multer";
import { createCourseSchema, updateCourseSchema } from "./course-schema.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import courseController from "./course-controller.js";

const upload = multer({ dest: "uploads/materials/" });

class CourseRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", tryCatch(courseController.getAll));
    this.router.get("/:id", tryCatch(courseController.getById));

    this.router.post(
      "/",
      authTokenMiddleware.authenticate,
      validateCredentials(createCourseSchema),
      tryCatch(courseController.create)
    );

    this.router.put(
      "/:id",
      authTokenMiddleware.authenticate,
      validateCredentials(updateCourseSchema),
      tryCatch(courseController.update)
    );

    this.router.delete(
      "/:id",
      authTokenMiddleware.authenticate,
      tryCatch(courseController.remove)
    );

    this.router.post(
      "/:id/material",
      authTokenMiddleware.authenticate,
      upload.single("file"),
      tryCatch(courseController.upload)
    );
  }
}

export default new CourseRoutes().router;
