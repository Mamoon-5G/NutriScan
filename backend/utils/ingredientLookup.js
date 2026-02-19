import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ADDITIVES_PATH = path.resolve(__dirname, "../data/additives.json");

let additivesData = null;

/**
 * Load additives data from JSON file
 */
const loadAdditives = () => {
  if (!additivesData) {
    try {
      const data = fs.readFileSync(ADDITIVES_PATH, "utf-8");
      additivesData = JSON.parse(data);
    } catch (err) {
      console.error("Failed to load additives data:", err);
      additivesData = {};
    }
  }
  return additivesData;
};

/**
 * Parse ingredient code from OpenFoodFacts format (e.g., "en:e211" -> "e211")
 */
const parseIngredientCode = (ingredient) => {
  if (!ingredient) return null;
  // Remove language prefix (e.g., "en:" or "fr:")
  const code = ingredient.replace(/^[a-z]{2}:/, "").toLowerCase();
  return code;
};

/**
 * Get ingredient details by code
 */
export const getIngredientDetails = (ingredientCode) => {
  const additives = loadAdditives();
  const code = parseIngredientCode(ingredientCode);
  
  if (!code) return null;

  const details = additives[code];
  
  if (details) {
    return {
      code: code,
      ...details
    };
  }

  // Return a generic entry if not found in our database
  return {
    code: code,
    name: `Unknown Additive (${code})`,
    category: "Unknown",
    description: "Limited information available",
    why_harmful: "Information not available in database",
    health_effects: ["Limited safety data available"],
    environmental_impact: "Unknown",
    usage: "Unknown",
    risk_level: "Unknown",
    alternatives: "Consult food labels for alternatives"
  };
};

/**
 * Get detailed information for multiple ingredients
 */
export const getIngredientDetailsMap = (ingredients) => {
  if (!Array.isArray(ingredients)) return {};

  const detailsMap = {};
  
  ingredients.forEach(ingredient => {
    const details = getIngredientDetails(ingredient);
    if (details && details.code) {
      detailsMap[details.code] = details;
    }
  });

  return detailsMap;
};

/**
 * Get harmful ingredients with full details
 */
export const getHarmfulIngredientsWithDetails = (ingredientsArray) => {
  if (!Array.isArray(ingredientsArray)) return [];

  return ingredientsArray
    .map(ingredient => getIngredientDetails(ingredient))
    .filter(details => details && details.code);
};

/**
 * Get risk level color for UI
 */
export const getRiskLevelColor = (riskLevel) => {
  if (!riskLevel) return "text-muted-foreground";
  
  const level = riskLevel.toLowerCase();
  if (level.includes("high")) return "text-red-600 font-semibold";
  if (level.includes("moderate-high")) return "text-orange-600 font-semibold";
  if (level.includes("moderate")) return "text-yellow-600";
  if (level.includes("low-moderate")) return "text-yellow-500";
  if (level.includes("low")) return "text-green-600";
  
  return "text-muted-foreground";
};
