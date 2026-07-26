import { z } from "zod";
import { searchProductByNameService, fetchProductByBarcodeService, analyzeProductService } from "../services/productService.js";
import { AppError, NotFoundError, ValidationError } from "../utils/errors.js";

const searchSchema = z.object({
  name: z.string().min(1, "Product name is required").trim(),
  limit: z.coerce.number().int().min(1).max(20).default(10)
});

const barcodeSchema = z.object({
  barcode: z.string().regex(/^\d+$/, "Barcode must contain only numbers").min(3, "Invalid barcode")
});

const analyzeProductSchema = z.object({
  product: z.object({
    product_name: z.string().optional(),
    harmful_ingredients: z.array(z.string()).optional(),
    additives_tags: z.array(z.string()).optional(),
    nutrition_grade: z.string().optional(),
    nutrition_grades: z.string().optional(),
    ecoscore_grade: z.string().optional(),
    brands: z.string().optional()
  }).passthrough()
});

/**
 * Search for products by name using OpenFoodFacts API
 */
export const searchProductByName = async (req, res) => {
  const validationResult = searchSchema.safeParse({ name: req.params.name, limit: req.query.limit });
  if (!validationResult.success) {
    throw new ValidationError(validationResult.error.errors[0].message);
  }
  const { name, limit } = validationResult.data;

  const products = await searchProductByNameService(name, limit);
  if (!products) {
    throw new NotFoundError("No products found matching your search");
  }

  res.json({ products });
};

/**
 * Fetch product details from OpenFoodFacts using a barcode
 */
export const fetchProductByBarcode = async (req, res) => {
  const validationResult = barcodeSchema.safeParse({ barcode: req.params.barcode });
  if (!validationResult.success) {
    throw new ValidationError(validationResult.error.errors[0].message);
  }
  const { barcode } = validationResult.data;

  const productData = await fetchProductByBarcodeService(barcode);
  if (!productData) {
    throw new NotFoundError("Product not found in database");
  }

  res.json(productData);
};

/**
 * Analyze a product directly from frontend data (optional)
 */
export const analyzeProduct = async (req, res) => {
  const validationResult = analyzeProductSchema.safeParse(req.body);
  if (!validationResult.success) {
    throw new ValidationError("Invalid product data provided");
  }
  const { product } = validationResult.data;

  const { analysisText, unifiedScore } = analyzeProductService(product);

  res.json({ analysis: analysisText, unified_score: unifiedScore });
};