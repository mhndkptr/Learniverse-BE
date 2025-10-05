import express from "express";

const router = express.Router();

const appsV1Routes = [];

appsV1Routes.forEach(({ path, route }) => {
  router.use(`/api/v1${path}`, route);
});

export default router;
