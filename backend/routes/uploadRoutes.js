import express from "express";
import multer from "multer";
import path from "path";
import os from "os";
import { uploadAndAnalyzeProduct } from "../controllers/uploadController.js";

const router = express.Router();

// Configure multer for file uploads strictly to Disk to prevent RAM exhaustion
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, os.tmpdir()); // Use native OS temp directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`);
  }
});

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
