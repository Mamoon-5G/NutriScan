import express from "express";
import { fetchProductByBarcode, analyzeProduct, searchProductByName } from "../controllers/productController.js";

const router = express.Router();

/**
 * GET /api/product/search/:name
 * - search products by name from OpenFoodFacts
 */
router.get("/search/:name", searchProductByName);

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
