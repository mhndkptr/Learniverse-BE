import BaseRoutes from "../../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../../middlewares/auth-token-middleware.js";
import validateCredentials from "../../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../../utils/tryCatcher.js";
import QuizOptionAnswerController from "./quiz-option-answer-controller.js";

import {
  getAllQuizOptionAnswerParamsSchema,
  createQuizOptionAnswerSchema,
  updateQuizOptionAnswerSchema,
  getQuizOptionAnswerByIdSchema,
  deleteQuizOptionAnswerSchema,
} from "./quiz-option-answer-schema.js";

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

class QuizOptionAnswerRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(getAllQuizOptionAnswerParamsSchema),
      tryCatch(QuizOptionAnswerController.getAll),
    ]);

    this.router.get("/:id", [validateParams(getQuizOptionAnswerByIdSchema), tryCatch(QuizOptionAnswerController.getById)]);

    this.router.post("/", [
      authTokenMiddleware.authenticate,
      validateCredentials(createQuizOptionAnswerSchema),
      tryCatch(QuizOptionAnswerController.create),
    ]);

    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      validateParams(getQuizOptionAnswerByIdSchema),
      validateCredentials(updateQuizOptionAnswerSchema),
      tryCatch(QuizOptionAnswerController.update),
    ]);

    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      validateParams(getQuizOptionAnswerByIdSchema),
      validateQueryParamsCredentials(deleteQuizOptionAnswerSchema),
      tryCatch(QuizOptionAnswerController.delete),
    ]);
  }
}

export default new QuizOptionAnswerRoutes().router;