import fs from "fs";
import { z } from "zod";
import { analyzeFoodImageService, extractVisionDataService, recommendAlternativesService } from "../services/llmService.js";
import { AppError, ValidationError } from "../utils/errors.js";

const productSchema = z.object({
  product: z.record(z.any()).refine(val => Object.keys(val).length > 0, {
    message: "Product data cannot be empty"
  })
});

const cleanupFiles = (files, req) => {
  if (!files) return;
  const list = [
    ...(files.product_front_image || []),
    ...(files.ingredients_image || []),
    ...(files.nutrition_image || [])
  ];
  list.forEach(file => {
    if (file && file.path) {
      fs.promises.unlink(file.path).catch(err => {
        if (req && req.log) {
          req.log.error({ err, path: file.path }, "Failed to delete temp file");
        } else {
          console.error("Failed to delete temp file:", file.path, err.message);
        }
      });
    }
  });
};

export const analyzeFoodWithLLM = async (req, res) => {
  if (!req.file) {
    throw new ValidationError("No image file provided");
  }

  try {
    const fileBuffer = await fs.promises.readFile(req.file.path);
    const imageBase64 = fileBuffer.toString("base64");
    const result = await analyzeFoodImageService(imageBase64, req.file.mimetype);
    return res.json(result);
  } finally {
    fs.promises.unlink(req.file.path).catch(err => {
      req.log.error({ err, path: req.file.path }, "Failed to delete temp file");
    });
  }
};

export const analyzeProductVision = async (req, res) => {
  const files = req.files;
  const frontFile = files?.product_front_image?.[0] || files?.nutrition_image?.[0];
  const ingredientsFile = files?.ingredients_image?.[0];

  if (!frontFile || !ingredientsFile) {
    cleanupFiles(files, req);
    throw new ValidationError("Missing required images (front and ingredients).");
  }

  try {
    const frontBuffer = await fs.promises.readFile(frontFile.path);
    const ingredientsBuffer = await fs.promises.readFile(ingredientsFile.path);
    
    const frontBase64 = frontBuffer.toString("base64");
    const ingredientsBase64 = ingredientsBuffer.toString("base64");
    
    try {
      const productData = await extractVisionDataService(
        frontBase64, frontFile.mimetype,
        ingredientsBase64, ingredientsFile.mimetype
      );
      return res.json(productData);
    } catch (err) {
      if (err.message.includes("not a valid food product") || err.message.includes("error")) {
        throw new ValidationError(err.message);
      }
      throw err;
    }
  } finally {
    cleanupFiles(files, req);
  }
};

export const recommendAlternativesWithLLM = async (req, res) => {
  const validationResult = productSchema.safeParse(req.body || {});
  if (!validationResult.success) {
    throw new ValidationError(validationResult.error.errors[0].message);
  }
  const { product } = validationResult.data;

  const result = await recommendAlternativesService(product);
  return res.json(result);
};