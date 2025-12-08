import BaseRoutes from "../../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../../utils/tryCatcher.js";
import QuizAttemptController from "./quiz-attempt-controller.js";

import {
  createQuizAttemptSchema,
  deleteQuizAttemptSchema,
  updateQuizAttemptSchema,
  getAllQuizAttemptParamsSchema,
} from "./quiz-attempt-schema.js";

class QuizAttemptRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(getAllQuizAttemptParamsSchema),
      tryCatch(QuizAttemptController.getAll),
    ]);

    this.router.get("/:id", [
      authTokenMiddleware.authenticate,
      tryCatch(QuizAttemptController.getById),
    ]);

    this.router.post("/", [
      authTokenMiddleware.authenticate,
      validateCredentials(createQuizAttemptSchema),
      tryCatch(QuizAttemptController.create),
    ]);

    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      validateCredentials(updateQuizAttemptSchema),
      tryCatch(QuizAttemptController.update),
    ]);

    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(deleteQuizAttemptSchema),
      tryCatch(QuizAttemptController.delete),
    ]);
  }
}

export default new QuizAttemptRoutes().router;