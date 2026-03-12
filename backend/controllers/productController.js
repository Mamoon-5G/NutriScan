import axios from "axios";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { predictHealthML } from "../utils/mlPredictor.js";
import { getHarmfulIngredientsWithDetails } from "../utils/ingredientLookup.js";
import { calculateUnifiedScore } from "../utils/scoreCalculator.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure data directory exists
const dataDir = path.resolve(__dirname, "../data");
const CSV_PATH = path.join(dataDir, "training_data.csv");

const ensureDataDir = () => {
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
    console.log("Created data directory:", dataDir);
  }
};

const ensureCSVHeader = () => {
  ensureDataDir();
  if (!fs.existsSync(CSV_PATH)) {
    fs.writeFileSync(
      CSV_PATH,
      "sugar,fat,salt,fiber,protein,energy,additives,nova,plastic,palm_oil,health_label,eco_label\n"
    );
    console.log("CSV header created at:", CSV_PATH);
  }
};

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

// Generate Lables

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


const saveToCSV = (features, labels) => {
  try {
    ensureCSVHeader();

    const row = [
      features.sugar_100g,
      features.fat_100g,
      features.salt_100g,
      features.fiber_100g,
      features.protein_100g,
      features.energy_kcal,
      features.additives_count,
      features.nova_group,
      features.plastic_packaging,
      features.palm_oil,
      labels.health_label,
      labels.eco_label
    ].join(",");

    fs.appendFileSync(CSV_PATH, row + "\n");
  } catch (err) {
    console.warn("Failed to save to CSV:", err.message);
    // Don't crash if CSV save fails
  }
};

/**
 * Simple environmental impact assessment based on product name
 */
const getEnvironmentalImpact = (productName) => {
  if (!productName) return "Unknown";

  const name = productName.toLowerCase();

  // Basic categorization based on keywords
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

/**
 * Search for products by name using OpenFoodFacts API
 */
// export const searchProductByName = async (req, res) => {
//   try {
//     const { name } = req.params;

//     if (!name || name.trim() === "") {
//       return res.status(400).json({ error: "Product name is required" });
//     }

//     console.log(`Searching for product by name: ${name}`);
//     const response = await axios.get(`https://world.openfoodfacts.org/cgi/search.pl`, {
//       params: {
//         search_terms: name,
//         search_simple: 1,
//         action: "process",
//         format: "json",
//         page_size: 5
//       }
//     });

//     if (!response.data.products || response.data.products.length === 0) {
//       return res.status(404).json({ error: "No products found matching your search" });
//     }

//     // Return top 5 results
//     const results = response.data.products.slice(0, 5).map(product => ({
//       barcode: product.barcode || product.code || "",
//       product_name: product.product_name || "Unknown Product",
//       brands: product.brands || "N/A",
//       image_url: product.image_url || product.image_front_url || "",
//       nutrition_grade: product.nutrition_grades || product.nutriscore_grade || "unknown",
//       ecoscore_grade: product.ecoscore_grade || "unknown"
//     }));

//     console.log(`✅ Found ${results.length} product(s) matching: ${name}`);
//     res.json({ products: results });
//   } catch (error) {
//     console.error("❌ Error searching products:", error);
//     res.status(500).json({ error: "Failed to search products" });
//   }
// };

/**
 * Fetch product details from OpenFoodFacts using a barcode
 */
export const fetchProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    console.log(`Fetching product data for barcode: ${barcode}`);
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);

    if (response.data.status !== 1 || !response.data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = response.data.product;
    console.log(`Product found: ${product.product_name || 'Unknown'}`);

    // Extract ML features for rule-based and ML predictions
    const ml_features = extractMLFeatures(product);
    const rule_based_labels = generateLabels(ml_features);

    // Try to save to CSV (non-critical)
    saveToCSV(ml_features, rule_based_labels);

    // Get ML prediction (optional - won't crash if it fails)
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
      console.log(`🤖 ML prediction result:`, ml_prediction);
    } catch (mlErr) {
      console.warn("⚠️ ML prediction failed (non-critical):", mlErr.message);
      // Continue without ML prediction
    }

    // Format environmental impact
    const environmentalImpact = getEnvironmentalImpact(product.product_name);

    // Get detailed information for harmful ingredients
    const harmfulIngredientsArray = product.additives_tags || [];
    const harmfulIngredientsWithDetails = getHarmfulIngredientsWithDetails(harmfulIngredientsArray);

    // Centralized scoring
    const unifiedScore = calculateUnifiedScore({
      ml_prediction,
      rule_based_labels,
      environmentalImpact,
      confidence: 1.0 // Placeholder, can be improved with model/LLM confidence
    });

    // Build response with all available data
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

      // ML/Analysis data
      rule_based_health_label: rule_based_labels.health_label,
      ml_health_label: ml_prediction.ml_health_label,
      environmental_impact: environmentalImpact,
      ml_features,
      labels: rule_based_labels,

      // Unified scoring
      unified_score: unifiedScore
    };

    res.json(responseData);
  } catch (error) {
    console.error("Error fetching product:", error);
    if (error.response?.status === 404) {
      res.status(404).json({ error: "Product not found in database" });
    } else {
      res.status(500).json({ error: "Failed to fetch product data" });
    }
  }
};

/**
 * Analyze a product directly from frontend data (optional)
 */
export const analyzeProduct = async (req, res) => {
  try {
    const { product } = req.body;

    if (!product || Object.keys(product).length === 0) {
      return res.status(400).json({ error: "Product data is required" });
    }

    // Extract analysis data
    const productName = product.product_name || "Unknown Product";
    const harmfulIngredients = product.harmful_ingredients || product.additives_tags || [];
    const nutritionGrade = product.nutrition_grade || product.nutrition_grades || "unknown";
    const ecoScore = product.ecoscore_grade || "unknown";
    const brands = product.brands || "N/A";

    // Determine health risk level
    const healthRisk = harmfulIngredients.length > 3
      ? "High – contains multiple additives"
      : harmfulIngredients.length > 0
        ? "Moderate – contains some additives"
        : "Low – minimal harmful ingredients detected";

    // Centralized scoring (reuse rule-based for now, as ML/LLM not available here)
    const rule_based_labels = { health_label: harmfulIngredients.length > 3 ? 2 : harmfulIngredients.length > 0 ? 1 : 0, eco_label: ecoScore === 'd' || ecoScore === 'e' ? 2 : ecoScore === 'c' ? 1 : 0 };
    const unifiedScore = calculateUnifiedScore({
      rule_based_labels,
      environmentalImpact: ecoScore,
      confidence: 1.0
    });

    // Create formatted analysis string
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

    res.json({ analysis: analysisText, unified_score: unifiedScore });
  } catch (error) {
    console.error("Error analyzing product:", error);
    res.status(500).json({ error: "Failed to analyze product" });
  }
};