import express from "express";
import multer from "multer";
import { analyzeFoodWithGemini } from "../controllers/geminiController.js";

const router = express.Router();

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
});

/**
 * POST /api/analyze-food
 * - Accepts a food image
 * - Sends to Gemini LLM for analysis
 * - Returns analysis text
 */
router.post("/", upload.single("image"), analyzeFoodWithGemini);

export default router;
