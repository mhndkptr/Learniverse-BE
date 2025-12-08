import BaseRoutes from "../../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../../utils/tryCatcher.js";
import QuizAttemptQuestionAnswerController from "./quiz-attempt-question-answer-controller.js";

import {
  getAllQuizAttemptQuestionAnswerParamsSchema,
  createQuizAttemptQuestionAnswerSchema,
  updateQuizAttemptQuestionAnswerSchema,
  getQuizAttemptQuestionAnswerByIdSchema,
  deleteQuizAttemptQuestionAnswerSchema,
} from "./quiz-attempt-question-answer-schema.js";

const validateParams = (schema) => (req, res, next) => {
  const validated = schema.validate(req.params, {
    abortEarly: false,
    errors: { wrap: { label: "" } },
    convert: true,
  });

  if (validated.error) {
    next(validated.error);
  } else {
    req.params = validated.value;
    next();
  }
};

class QuizAttemptQuestionAnswerRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(getAllQuizAttemptQuestionAnswerParamsSchema),
      tryCatch(QuizAttemptQuestionAnswerController.getAll),
    ]);

    this.router.get("/:id", [
      validateParams(getQuizAttemptQuestionAnswerByIdSchema), 
      tryCatch(QuizAttemptQuestionAnswerController.getById)
    ]);

    this.router.post("/", [
      authTokenMiddleware.authenticate,
      validateCredentials(createQuizAttemptQuestionAnswerSchema),
      tryCatch(QuizAttemptQuestionAnswerController.create),
    ]);

    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      validateParams(getQuizAttemptQuestionAnswerByIdSchema),
      validateCredentials(updateQuizAttemptQuestionAnswerSchema),
      tryCatch(QuizAttemptQuestionAnswerController.update),
    ]);

    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      validateParams(getQuizAttemptQuestionAnswerByIdSchema),
      validateQueryParamsCredentials(deleteQuizAttemptQuestionAnswerSchema),
      tryCatch(QuizAttemptQuestionAnswerController.delete),
    ]);
  }
}

export default new QuizAttemptQuestionAnswerRoutes().router;