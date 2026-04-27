import express from "express";
import multer from "multer";
import os from "os";
import { analyzeFoodWithLLM, recommendAlternativesWithLLM, analyzeProductVision } from "../controllers/llmController.js";

const router = express.Router();

// Use temporary disk storage to prevent massive RAM memory spikes during concurrent uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir());
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  }
});

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
 * POST /api/analyze-vision
 * - Accepts multiple images (ingredients and nutrition)
 * - Returns structured product data
 */
router.post("/vision", upload.fields([
  { name: "ingredients_image", maxCount: 1 },
  { name: "nutrition_image", maxCount: 1 }
]), analyzeProductVision);

/**
 * POST /api/analyze-food/recommendations
 * - Accepts product metadata
 * - Sends to LLM for alternative product suggestions
 * - Returns structured recommendations
 */
router.post("/recommendations", recommendAlternativesWithLLM);

export default router;