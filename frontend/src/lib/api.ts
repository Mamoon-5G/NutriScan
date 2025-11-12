// API utility functions for EcoScan
// Base API URL - loaded from .env file via Vite
const API_BASE_URL = import.meta.env.VITE_API_URL || "";

/**
 * Upload image to detect barcode
 * @param file - Image file to upload
 * @returns Promise with barcode data
 */
export const uploadImage = async (file: File) => {
  const formData = new FormData();
  formData.append("image", file);

  const response = await fetch(`${API_BASE_URL}/api/upload`, {
    method: "POST",
    body: formData,
  });

  if (!response.ok) {
    throw new Error("Failed to upload image");
  }

  return response.json();
};

/**
 * Fetch product details by barcode
 * @param barcode - Product barcode
 * @returns Promise with product data
 */
export const getProductDetails = async (barcode: string) => {
  const response = await fetch(`${API_BASE_URL}/api/product/${barcode}`);

  if (!response.ok) {
    throw new Error("Failed to fetch product details");
  }

  return response.json();
};

/**
 * Analyze product
 * @param product - Product object to analyze
 * @returns Promise with analysis data
 */
export const analyzeProduct = async (product: unknown) => {
  const response = await fetch(`${API_BASE_URL}/api/product/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ product }),
  });

  if (!response.ok) {
    throw new Error("Failed to analyze product");
  }

  return response.json();
};
