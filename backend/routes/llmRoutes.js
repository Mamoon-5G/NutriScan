import express from "express";
import multer from "multer";
import { analyzeFoodWithLLM, recommendAlternativesWithLLM } from "../controllers/llmController.js";

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
 * - Sends to LLM for analysis
 * - Returns analysis text
 */
router.post("/", upload.single("image"), analyzeFoodWithLLM);

/**
 * POST /api/analyze-food/recommendations
 * - Accepts product metadata
 * - Sends to LLM for alternative product suggestions
 * - Returns structured recommendations
 */
router.post("/recommendations", recommendAlternativesWithLLM);

export default router;