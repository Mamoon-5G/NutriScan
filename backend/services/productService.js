import axios from "axios";
import { predictHealthML } from "../utils/mlPredictor.js";
import { getHarmfulIngredientsWithDetails } from "../utils/ingredientLookup.js";
import { calculateUnifiedScore } from "../utils/scoreCalculator.js";
import { getProductFromCache, saveProductToCache, saveToCSV } from "../repositories/productRepository.js";
import logger from "../utils/logger.js";

const extractMLFeatures = (product) => {
  const nutriments = product.nutriments || {};
  const packagingTags = product.packaging_tags || [];
  const ingredientsText = (product.ingredients_text || "").toLowerCase();

  return {
    sugar_100g: nutriments.sugars_100g ?? 0,
    fat_100g: nutriments.fat_100g ?? 0,
    salt_100g: nutriments.salt_100g ?? 0,
    fiber_100g: nutriments.fiber_100g ?? 0,
    protein_100g: nutriments.proteins_100g ?? 0,
    energy_kcal:
      nutriments.energy_kcal_100g ??
      (nutriments.energy_100g ? nutriments.energy_100g / 4.184 : 0),

    additives_count: product.additives_tags?.length ?? 0,
    nova_group: product.nova_group ?? 0,

    plastic_packaging: packagingTags.some(p => p.includes("plastic")) ? 1 : 0,
    palm_oil: ingredientsText.includes("palm oil") ? 1 : 0,
  };
};

const encodeEcoScore = (grade) => {
  switch (grade) {
    case "a": return 0;
    case "b": return 1;
    case "c": return 2;
    case "d": return 3;
    case "e": return 4;
    default: return 2;
  }
};

const generateLabels = (f) => {
  let health_label = 0;
  let eco_label = 0;

  // Health
  if (f.sugar_100g > 20 || f.salt_100g > 1.5 || f.additives_count > 3 || f.nova_group === 4) {
    health_label = 2; // unhealthy
  } else if (f.sugar_100g > 10 || f.additives_count > 1) {
    health_label = 1; // moderate
  }

  // Environment
  if (f.plastic_packaging && f.palm_oil) {
    eco_label = 2; // high impact
  } else if (f.plastic_packaging || f.palm_oil) {
    eco_label = 1; // moderate
  }

  return { health_label, eco_label };
};

const getEnvironmentalImpact = (productName) => {
  if (!productName) return "Unknown";

  const name = productName.toLowerCase();

  if (name.includes('organic') || name.includes('bio')) {
    return "Low - Organic product";
  } else if (name.includes('plastic') || name.includes('disposable')) {
    return "High - Single-use plastic";
  } else if (name.includes('recycled') || name.includes('sustainable')) {
    return "Low - Sustainable packaging";
  } else {
    return "Moderate - Standard product";
  }
};

export const searchProductByNameService = async (name, pageSize) => {
  logger.info({ name, pageSize }, "Searching for product by name");
  const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
    params: {
      search_terms: name,
      search_simple: 1,
      action: "process",
      format: "json",
      page_size: pageSize
    }
  });

  if (!response.data.products || response.data.products.length === 0) {
    return null;
  }

  const results = response.data.products.slice(0, pageSize).map(product => ({
    barcode: product.barcode || product.code || "",
    product_name: product.product_name || "Unknown Product",
    brands: product.brands || "N/A",
    image_url: product.image_url || product.image_front_url || "",
    nutrition_grade: product.nutrition_grades || product.nutriscore_grade || "unknown",
    ecoscore_grade: product.ecoscore_grade || "unknown"
  }));

  logger.info({ count: results.length, name }, "Found products matching search");
  return results;
};

export const fetchProductByBarcodeService = async (barcode) => {
  const cachedProduct = await getProductFromCache(barcode);
  if (cachedProduct) {
    logger.info({ barcode }, "Serving product from cache");
    return cachedProduct;
  }

  logger.info({ barcode }, "Fetching product data from OpenFoodFacts");
  const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

  if (response.data.status !== 1 || !response.data.product) {
    return null;
  }

  const product = response.data.product;
  logger.info({ productName: product.product_name, barcode }, "Product found in OFF");

  const ml_features = extractMLFeatures(product);
  const rule_based_labels = generateLabels(ml_features);
  
  // Fire and forget Async CSV save (non-blocking)
  saveToCSV(ml_features, rule_based_labels).catch(err => logger.warn({ err }, "Background CSV error"));

  let ml_prediction = { ml_health_label: "unavailable" };
  try {
    const mlInput = {
      sugar: ml_features.sugar_100g,
      fat: ml_features.fat_100g,
      salt: ml_features.salt_100g,
      fiber: ml_features.fiber_100g,
      protein: ml_features.protein_100g,
      energy: ml_features.energy_kcal,
      additives: ml_features.additives_count,
      nova: ml_features.nova_group,
      plastic: ml_features.plastic_packaging,
      palm_oil: ml_features.palm_oil,
    };

    ml_prediction = await predictHealthML(mlInput);
    logger.info({ ml_prediction }, "ML prediction result");
  } catch (mlErr) {
    logger.warn({ err: mlErr }, "ML prediction failed (non-critical)");
  }

  const environmentalImpact = getEnvironmentalImpact(product.product_name);
  const harmfulIngredientsArray = product.additives_tags || [];
  const harmfulIngredientsWithDetails = getHarmfulIngredientsWithDetails(harmfulIngredientsArray);

  const unifiedScore = calculateUnifiedScore({
    ml_prediction,
    rule_based_labels,
    environmentalImpact,
    confidence: 1.0
  });

  const responseData = {
    product_name: product.product_name || "Unknown Product",
    brands: product.brands || "N/A",
    image_url: product.image_url || product.image_front_url || "",
    nutrition_grade: product.nutrition_grades || product.nutriscore_grade || "unknown",
    ecoscore_grade: product.ecoscore_grade || "unknown",
    ingredients_text: product.ingredients_text || "No ingredients information available",
    harmful_ingredients: harmfulIngredientsArray || [],
    harmful_ingredients_details: harmfulIngredientsWithDetails,
    allergens: product.allergens || "No allergen information available",
    nova_group: product.nova_group || 0,
    additives_tags: product.additives_tags || [],
    nutrition_grades: product.nutrition_grades || product.nutriscore_grade || "unknown",
    rule_based_health_label: rule_based_labels.health_label,
    ml_health_label: ml_prediction.ml_health_label,
    environmental_impact: environmentalImpact,
    ml_features,
    labels: rule_based_labels,
    unified_score: unifiedScore
  };

  await saveProductToCache(barcode, responseData);

  return responseData;
};

export const analyzeProductService = (product) => {
  const productName = product.product_name || "Unknown Product";
  const harmfulIngredients = product.harmful_ingredients || product.additives_tags || [];
  const nutritionGrade = product.nutrition_grade || product.nutrition_grades || "unknown";
  const ecoScore = product.ecoscore_grade || "unknown";
  const brands = product.brands || "N/A";

  const healthRisk = harmfulIngredients.length > 3
    ? "High – contains multiple additives"
    : harmfulIngredients.length > 0
      ? "Moderate – contains some additives"
      : "Low – minimal harmful ingredients detected";

  const rule_based_labels = { health_label: harmfulIngredients.length > 3 ? 2 : harmfulIngredients.length > 0 ? 1 : 0, eco_label: ecoScore === 'd' || ecoScore === 'e' ? 2 : ecoScore === 'c' ? 1 : 0 };
  const unifiedScore = calculateUnifiedScore({
    rule_based_labels,
    environmentalImpact: ecoScore,
    confidence: 1.0
  });

  const analysisText = `
🏷️ Product: ${productName}
🏢 Brand: ${brands}

📊 NUTRITIONAL ANALYSIS:
• Nutrition Grade: ${nutritionGrade.toUpperCase()}
• Eco Score: ${ecoScore.toUpperCase()}
• Health Risk Level: ${healthRisk}

🧪 INGREDIENTS ANALYSIS:
${harmfulIngredients.length > 0
      ? `⚠️ Potentially harmful additives detected:\n${harmfulIngredients.slice(0, 5).map(ingredient => `  • ${ingredient.replace(/^en:/, '')}`).join('\n')}`
      : '✅ No major harmful additives detected'
    }

${harmfulIngredients.length > 5 ? `\n... and ${harmfulIngredients.length - 5} more additives` : ''}

🌱 ENVIRONMENTAL IMPACT:
${ecoScore === 'a' || ecoScore === 'b'
      ? '✅ Good environmental impact'
      : ecoScore === 'c'
        ? '⚠️ Moderate environmental impact'
        : ecoScore === 'd' || ecoScore === 'e'
          ? '❌ High environmental impact'
          : '❓ Environmental impact data not available'
    }

💡 RECOMMENDATION:
${nutritionGrade === 'a' || nutritionGrade === 'b'
      ? '✅ This product has a good nutritional profile.'
      : nutritionGrade === 'c'
        ? '⚠️ This product has an average nutritional profile. Consider alternatives.'
        : nutritionGrade === 'd' || nutritionGrade === 'e'
          ? '❌ This product has a poor nutritional profile. Look for healthier alternatives.'
          : 'Nutritional information is limited. Check the ingredients list carefully.'
    }
  `.trim();

  return { analysisText, unifiedScore };
};
