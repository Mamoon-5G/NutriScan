import express from "express";
import multer from "multer";
import path from "path";
import { uploadAndAnalyzeProduct } from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for file uploads in memory
const storage = multer.memoryStorage();

// File filter to only allow images
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed!"), false);
  }
};

// Configure multer with size limit (5MB)
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  },
  fileFilter: fileFilter
});

/**
 * POST /api/upload
 * - accepts image file upload
 * - processes image to detect barcode and analyze product
 */
router.post("/", upload.single("image"), uploadAndAnalyzeProduct);

export default router;
