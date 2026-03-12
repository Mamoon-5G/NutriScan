// controllers/uploadController.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import { MultiFormatReader, RGBLuminanceSource, BinaryBitmap, HybridBinarizer } from '@zxing/library';
import jimpNamespace from "jimp";

const Jimp = jimpNamespace.Jimp || jimpNamespace;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Handle product image upload and barcode detection
 */
export const uploadAndAnalyzeProduct = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    console.log("Processing image from memory buffer");

    // Step 1: Try to decode barcode from image using zxing (memory efficient)
    let barcode = null;

    try {
      console.log("Attempting barcode detection via ZXing and Jimp...");

      // Parse image data (JPEG/PNG) from buffer
      const image = await Jimp.read(req.file.buffer);
      
      // Downscale if too large to save memory slightly, though Jimp is lightweight
      if (image.bitmap.width > 1200) {
        image.resize(1200, jimpNamespace.AUTO || Jimp.AUTO);
      }
      
      const width = image.bitmap.width;
      const height = image.bitmap.height;
      const rgbaData = new Uint8ClampedArray(image.bitmap.data);

      const luminanceSource = new RGBLuminanceSource(rgbaData, width, height);
      const binaryBitmap = new BinaryBitmap(new HybridBinarizer(luminanceSource));
      const reader = new MultiFormatReader();
      
      const result = reader.decode(binaryBitmap);
      
      if (result && result.getText()) {
        barcode = result.getText();
        console.log("Barcode found via ZXing:", barcode);
      }

    } catch (err) {
      console.warn("ZXing barcode detection failed:", err.message);
    }



    // Step 4: Return result
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

  } catch (error) {
    console.error("Upload processing failed:", error);



    res.status(500).json({
      error: "Failed to process image",
      details: error.message
    });
  }
};