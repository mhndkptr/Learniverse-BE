import express from "express";
import multer from "multer";
import {
  getAll,
  getById,
  create,
  update,
  remove,
  upload,
} from "./course-controller.js";
import { verifyToken } from "../../../middlewares/auth-token-middleware.js";

const router = express.Router();
const uploadFile = multer({ dest: "uploads/materials/" });

// Public
router.get("/", getAll);
router.get("/:id", getById);

// Protected (Admin/Mentor)
router.post("/", verifyToken, create);
router.put("/:id", verifyToken, update);
router.delete("/:id", verifyToken, remove);
router.post("/:id/material", verifyToken, uploadFile.single("file"), upload);

export default router;
