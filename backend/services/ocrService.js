import Tesseract from "tesseract.js";
import logger from "../utils/logger.js";

export const extractBarcodeFromImageService = async (imagePath) => {
  let barcode = null;

  try {
    logger.info("Attempting barcode detection via OCR...");

    const { data: { text } } = await Tesseract.recognize(imagePath, "eng", {
      logger: m => {
        if (m.status === 'recognizing text') {
          // Keep this silent or trace level to avoid spamming logs, using logger.debug or silent
          // We will just use silent or drop it to avoid log bloat for progress, 
          // but we can use debug.
        }
      }
    });

    logger.debug({ text }, "OCR Raw text");

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
        logger.info({ barcode: matches[0] }, "Barcode found via OCR");
        break;
      }
    }

    if (!barcode) {
      const allDigits = text.match(/\d+/g);
      if (allDigits) {
        const potentialBarcodes = allDigits.filter(num => num.length >= 8 && num.length <= 13);
        if (potentialBarcodes.length > 0) {
          barcode = potentialBarcodes[0];
          logger.info({ barcode: potentialBarcodes[0] }, "Potential barcode found");
        }
      }
    }

  } catch (err) {
    logger.warn({ err }, "OCR barcode detection failed");
  }

  return barcode;
};
