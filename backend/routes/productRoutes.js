import express from "express";
import { fetchProductByBarcode, analyzeProduct } from "../controllers/productController.js";

const router = express.Router();

/**
 * GET /api/product/:barcode
 * - fetch product from OpenFoodFacts and return raw + analysis summary
 */
router.get("/:barcode", fetchProductByBarcode);

/**
 * POST /api/product/analyze
 * - accepts JSON body with product object (useful if you already have product data)
 * - returns analysis result from our analysis util
 */
router.post("/analyze", analyzeProduct);

export default router;
