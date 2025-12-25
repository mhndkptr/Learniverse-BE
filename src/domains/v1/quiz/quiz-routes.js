import BaseRoutes from "../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import QuizController from "./quiz-controller.js";
import QuizQuestionRoutes from "./quiz-question/quiz-question-routes.js";
import QuizAttemptRoutes from "./quiz-attempt/quiz-attempt-routes.js";
import QuizOptionAnswerRoutes from "./quiz-option-answer/quiz-option-answer-routes.js";
import QuizAttemptQuestionAnswerRoutes from "./quiz-attempt-question-answer/quiz-attempt-question-answer-routes.js";

import {
  createQuizSchema,
  deleteQuizSchema,
  updateQuizSchema,
  getAllQuizParamsSchema,
} from "./quiz-schema.js";
import Role from "../../../common/enums/role-enum.js";
import enrollmentMiddleware from "../../../middlewares/enrollment-middleware.js";

class QuizRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      enrollmentMiddleware.check,
      validateQueryParamsCredentials(getAllQuizParamsSchema),
      tryCatch(QuizController.getAll),
    ]);
    this.router.get("/me/active", [
      authTokenMiddleware.authenticate,
      authTokenMiddleware.authorizeRoles([Role.STUDENT]),
      tryCatch(QuizController.getAllForStudent),
    ]);
    this.router.use("/question", QuizQuestionRoutes);
    this.router.use("/attempt", QuizAttemptRoutes);
    this.router.use("/optionAnswer", QuizOptionAnswerRoutes);
    this.router.use("/attemptQuestionAnswer", QuizAttemptQuestionAnswerRoutes);
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
