// controllers/uploadController.js
import fs from "fs";
import path from "path";
import axios from "axios";
import { fileURLToPath } from "url";
import Tesseract from "tesseract.js";

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

    const imagePath = path.join(__dirname, "../uploads", req.file.filename);
    console.log("📁 Processing image:", imagePath);

    // 🧠 Step 1: Try to decode barcode from image using OCR (more reliable for server-side)
    let barcode = null;

    try {
      console.log("🔍 Attempting barcode detection via OCR...");
      
      // Use Tesseract.js for both OCR and barcode detection
      const { data: { text } } = await Tesseract.recognize(imagePath, "eng", {
        logger: m => {
          if (m.status === 'recognizing text') {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        }
      });
      
      console.log("📝 OCR Raw text:", text);
      
      // Look for barcode-like patterns in OCR text (8-13 digits)
      const barcodePatterns = [
        /\b\d{13}\b/g,  // EAN-13 (most common)
        /\b\d{12}\b/g,  // UPC-A
        /\b\d{8}\b/g,   // EAN-8
        /\b\d{10}\b/g,  // ISBN-10
      ];
      
      for (const pattern of barcodePatterns) {
        const matches = text.match(pattern);
        if (matches && matches.length > 0) {
          barcode = matches[0];
          console.log("✅ Barcode found via OCR:", barcode);
          break;
        }
      }
      
      if (!barcode) {
        // Try to find any sequence of digits that might be a barcode
        const allDigits = text.match(/\d+/g);
        if (allDigits) {
          // Filter for potential barcodes (8+ digits)
          const potentialBarcodes = allDigits.filter(num => num.length >= 8 && num.length <= 13);
          if (potentialBarcodes.length > 0) {
            barcode = potentialBarcodes[0];
            console.log("✅ Potential barcode found:", barcode);
          }
        }
      }
      
    } catch (err) {
      console.warn("⚠️ OCR barcode detection failed:", err.message);
    }

    // 🧹 Step 3: Cleanup temp image
    try {
      fs.unlinkSync(imagePath);
    } catch (cleanupError) {
      console.warn("⚠️ Failed to cleanup temp file:", cleanupError.message);
    }

    // 🧠 Step 4: Return result
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
    console.error("❌ Upload processing failed:", error);
    
    // Cleanup temp file if it exists
    if (req.file) {
      try {
        const imagePath = path.join(__dirname, "../uploads", req.file.filename);
        fs.unlinkSync(imagePath);
      } catch (cleanupError) {
        console.warn("⚠️ Failed to cleanup temp file after error:", cleanupError.message);
      }
    }
    
    res.status(500).json({ 
      error: "Failed to process image", 
      details: error.message 
    });
  }
};
