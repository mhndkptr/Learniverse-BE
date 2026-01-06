import BaseRoutes from "../../../../base-classes/base-routes.js";
import authTokenMiddleware from "../../../../middlewares/auth-token-middleware.js";
import uploadFile from "../../../../middlewares/upload-file-middleware.js";
import validateCredentials from "../../../../middlewares/validate-credentials-middleware.js";
import validateQueryParamsCredentials from "../../../../middlewares/validate-query-params-credentials-middleware.js";
import tryCatch from "../../../../utils/tryCatcher.js";
import QuizQuestionController from "./quiz-question-controller.js";

import {
  createQuizQuestionSchema,
  deleteQuizQuestionSchema,
  updateQuizQuestionSchema,
  getAllQuizQuestionParamsSchema,
  getQuizQuestionByIdSchema,
} from "./quiz-question-schema.js";

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

class QuizQuestionRoutes extends BaseRoutes {
  routes() {
    this.router.get("/", [
      authTokenMiddleware.authenticate,
      validateQueryParamsCredentials(getAllQuizQuestionParamsSchema),
      tryCatch(QuizQuestionController.getAll),
    ]);

    this.router.get("/:id", [
      validateParams(getQuizQuestionByIdSchema),
      tryCatch(QuizQuestionController.getById),
    ]);

    this.router.post("/", [
      authTokenMiddleware.authenticate,
      uploadFile("image").single("image"),
      validateCredentials(createQuizQuestionSchema),
      tryCatch(QuizQuestionController.create),
    ]);

    this.router.patch("/:id", [
      authTokenMiddleware.authenticate,
      uploadFile("image").single("image"),
      validateParams(getQuizQuestionByIdSchema),
      validateCredentials(updateQuizQuestionSchema),
      tryCatch(QuizQuestionController.update),
    ]);

    this.router.delete("/:id", [
      authTokenMiddleware.authenticate,
      validateParams(getQuizQuestionByIdSchema),
      validateQueryParamsCredentials(deleteQuizQuestionSchema),
      tryCatch(QuizQuestionController.delete),
    ]);
  }
}

export default new QuizQuestionRoutes().router;
