import BaseRoutes from "../../../base-classes/base-routes.js";
import multer from "multer";
import { createUserSchema, updateUserSchema } from "./user.schema.js";
import validateCredentials from "../../../middlewares/validate-credentials-middleware.js";
import authTokenMiddleware from "../../../middlewares/auth-token-middleware.js";
import tryCatch from "../../../utils/tryCatcher.js";
import userController from "./user-controller.js";

const upload = multer({ dest: "uploads/profiles/" });

class UserRoutes extends BaseRoutes {
	routes() {
		this.router.get("/", tryCatch(userController.getAll));
		this.router.get("/:id", tryCatch(userController.getById));

		this.router.post(
			"/",
			authTokenMiddleware.authenticate,
			validateCredentials(createUserSchema),
			tryCatch(userController.create)
		);

		this.router.put(
			"/:id",
			authTokenMiddleware.authenticate,
			validateCredentials(updateUserSchema),
			tryCatch(userController.update)
		);

		this.router.delete(
			"/:id",
			authTokenMiddleware.authenticate,
			tryCatch(userController.remove)
		);

		this.router.post(
			"/:id/profile",
			authTokenMiddleware.authenticate,
			upload.single("file"),
			tryCatch(userController.uploadProfile)
		);
	}
}

export default new UserRoutes().router;

