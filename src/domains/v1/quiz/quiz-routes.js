import BaseRoutes from "../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import QuizController from "./quiz-controller.js";

import {
  createQuizSchema,
  deleteQuizSchema,
  updateQuizSchema,
  getAllQuizParamsSchema,
} from "./quiz-schema.js";

class QuizRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(getAllQuizParamsSchema),
      tryCatch(QuizController.getAll),
    ]);
    this.router.get("/:id", [tryCatch(QuizController.getById)]);
    this.router.post("/", [
      authTokenMiddleware.authenticate,
      validateCredentials(createQuizSchema),
      tryCatch(QuizController.create),
    ]);
    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      validateCredentials(updateQuizSchema),
      tryCatch(QuizController.update),
    ]);
    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(deleteQuizSchema),
      tryCatch(QuizController.delete),
    ]);
  }
}

export default new QuizRoutes().router;