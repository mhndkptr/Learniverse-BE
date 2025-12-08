import express from "express";
import authRoutes from "./domains/v1/auth/auth-routes.js";
import courseRoutes from "./domains/v1/course/course-routes.js";
import scheduleRoutes from "./domains/v1/schedule/schedule-routes.js";
import quizRoutes from "./domains/v1/quiz/quiz-routes.js";
import quizQuestionRoutes from "./domains/v1/quiz/quiz-question/quiz-question-routes.js";
import quizOptionAnswerRoutes from "./domains/v1/quiz/quiz-option-answer/quiz-option-answer-routes.js";
import quizAttemptRoutes from "./domains/v1/quiz/quiz-attempt/quiz-attempt-routes.js";
import quizAttemptQuestionAnswerRoutes from "./domains/v1/quiz/quiz-attempt-question-answer/quiz-attempt-question-answer-routes.js";
import userRoutes from "./domains/v1/user/user-routes.js";
import modulRoutes from "./domains/v1/modul/modul-routes.js";
import courseEnrollmentRoutes from "./domains/v1/course/course-enrollment/course-enrollment-routes.js";
import courseTransactionRoutes from "./domains/v1/course/course-transaction/course-transaction-routes.js";
import mentorRoutes from "./domains/v1/mentor/mentor-routes.js";

const router = express.Router();

const appsV1Routes = [
  { path: "/auth", route: authRoutes },
  { path: "/course/enrollment", route: courseEnrollmentRoutes },
  { path: "/course/transaction", route: courseTransactionRoutes },
  { path: "/course", route: courseRoutes },
  { path: "/schedule", route: scheduleRoutes },
  { path: "/quiz", route: quizRoutes },
  { path: "/quiz/question", route: quizQuestionRoutes },
  { path: "/quiz/optionAnswer", route: quizOptionAnswerRoutes },
  { path: "/quiz/attempt", route: quizAttemptRoutes },
  { path: "/quiz/attemptQuestionAnswer", route: quizAttemptQuestionAnswerRoutes },
  { path: "/user", route: userRoutes },
  { path: "/mentor", route: mentorRoutes },
  { path: "/modul", route: modulRoutes },
];

appsV1Routes.forEach(({ path, route }) => {
  router.use(`/api/v1${path}`, route);
});

export default router;
