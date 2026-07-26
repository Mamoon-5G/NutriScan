import fs from "fs";
import { extractBarcodeFromImageService } from "../services/ocrService.js";
import { ValidationError } from "../utils/errors.js";

/**
 * Handle product image upload and barcode detection
 */
export const uploadAndAnalyzeProduct = async (req, res) => {
  if (!req.file) {
    throw new ValidationError("No image file uploaded");
  }

  try {
    req.log.info({ path: req.file.path }, "Processing image from disk path");

    const barcode = await extractBarcodeFromImageService(req.file.path);

    if (barcode) {
      res.json({
        success: true,
        barcode: barcode,
        message: "Barcode detected successfully"
      });
    } else {
      res.json({
        success: false,
        error: "No barcode detected in the image",
        message: "Please try a clearer image or enter the barcode manually"
      });
    }
  } finally {
    // Clean up uploaded file from disk to avoid storage leaks
    fs.promises.unlink(req.file.path).catch(err => {
      req.log.error({ err, path: req.file.path }, "Failed to delete temp file");
    });
  }
};