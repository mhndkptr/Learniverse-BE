import express from "express";
import authRoutes from "./domains/v1/auth/auth-routes.js";
import courseRoutes from "./domains/v1/course/course-routes.js";
import scheduleRoutes from "./domains/v1/schedule/schedule-routes.js";
import quizRoutes from "./domains/v1/quiz/quiz-routes.js";
import userRoutes from "./domains/v1/user/user-routes.js";
import courseEnrollmentRoutes from "./domains/v1/course/course-enrollment/course-enrollment-routes.js";
import courseTransactionRoutes from "./domains/v1/course/course-transaction/course-transaction-routes.js";

const router = express.Router();

const appsV1Routes = [
  { path: "/auth", route: authRoutes },
  { path: "/course/enrollment", route: courseEnrollmentRoutes },
  { path: "/course/transaction", route: courseTransactionRoutes },
  { path: "/course", route: courseRoutes },
  { path: "/schedule", route: scheduleRoutes },
  { path: "/quiz", route: quizRoutes },
  { path: "/user", route: userRoutes },
];

appsV1Routes.forEach(({ path, route }) => {
  router.use(`/api/v1${path}`, route);
});

export default router;
