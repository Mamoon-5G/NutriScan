// API utility functions for NutriScan
import axios from "axios";

// Base API URL - loaded from .env file via Vite and normalized (no trailing slash)
const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");

/**
 * Upload image to detect barcode
 * @param file - Image file to upload
 * @returns Promise with barcode data
 */
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const url = `${API_BASE_URL}/api/upload`;
  console.debug("[api] POST", url);
  const { data } = await axios.post(url, formData);
  return data;
};

/**
 * Fetch product details by barcode
 * @param barcode - Product barcode
 * @returns Promise with product data
 */
export const getProductDetails = async (barcode: string) => {
  const url = `${API_BASE_URL}/api/product/${barcode}`;
  console.debug("[api] GET", url);
  const { data } = await axios.get(url);
  return data;
};

/**
 * Analyze product
 * @param product - Product object to analyze
 * @returns Promise with analysis data
 */
export const analyzeProduct = async (product: unknown) => {
  const url = `${API_BASE_URL}/api/product/analyze`;
  console.debug("[api] POST", url, product);
  const { data } = await axios.post(url, { product });
  return data;
};
