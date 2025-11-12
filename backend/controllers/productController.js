// controllers/productController.js
import axios from "axios";
import { getEnvironmentalImpact } from "../utils/environmentalImpact.js";

/**
 * Fetch product details from OpenFoodFacts using a barcode
 */
export const fetchProductByBarcode = async (req, res) => {
  try {
    const { barcode } = req.params;

    if (!barcode) {
      return res.status(400).json({ error: "Barcode is required" });
    }

    console.log(`🔍 Fetching product data for barcode: ${barcode}`);
    const response = await axios.get(`https://world.openfoodfacts.org/api/v0/product/${barcode}.json`);
    
    if (response.data.status !== 1 || !response.data.product) {
      return res.status(404).json({ error: "Product not found" });
    }

    const product = response.data.product;
    console.log(`✅ Product found: ${product.product_name || 'Unknown'}`);

    // Format product data for frontend consumption
    const productData = {
      product_name: product.product_name || "Unknown Product",
      brands: product.brands || "N/A",
      image_url: product.image_url || product.image_front_url || "",
      nutrition_grade: product.nutrition_grades || product.nutriscore_grade || "unknown",
      ecoscore_grade: product.ecoscore_grade || "unknown",
      ingredients_text: product.ingredients_text || "No ingredients information available",
      harmful_ingredients: product.additives_tags || [],
      allergens: product.allergens || "No allergen information available",
      nova_group: product.nova_group || 0,
      // Keep original data for analysis
      additives_tags: product.additives_tags || [],
      nutrition_grades: product.nutrition_grades || product.nutriscore_grade || "unknown"
    };
    const environmentalImpact = getEnvironmentalImpact(product.product_name);
    
    // Merge environmental impact data with product data
    const responseData = {
      ...productData,
      environmental_impact: environmentalImpact
    };
    
    res.json(responseData);
  } catch (error) {
    console.error("❌ Error fetching product:", error);
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

    res.json({ analysis: analysisText });
  } catch (error) {
    console.error("Error analyzing product:", error);
    res.status(500).json({ error: "Failed to analyze product" });
  }
};
