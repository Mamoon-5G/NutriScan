/**
 * utils/analysis.js
 * Simple rule-based heuristics to compute:
 * - healthRisk: "Safe" | "Moderate" | "Harmful"
 * - healthScore: 0..100 (higher = more harmful)
 * - environmentImpact: "Low" | "Medium" | "High"
 * - environmentScore: 0..100 (higher = worse)
 */

function clamp(v, a = 0, b = 100) {
  return Math.max(a, Math.min(b, v));
}

export function analyze(product) {
  // product: { name, brand, ingredients_text, ingredients[], nutrition_grade, nutriments, packaging, ecoscore }
  const p = product || {};
  const nutrigrade = (p.nutrition_grade || "").toLowerCase();
  const nutriments = p.nutriments || {};

  // --- Health heuristics (very basic, rule-based)
  // baseScore by nutrition grade (a=best, e=worst)
  let healthScore = 50;
  if (nutrigrade === "a") healthScore = 10;
  else if (nutrigrade === "b") healthScore = 25;
  else if (nutrigrade === "c") healthScore = 45;
  else if (nutrigrade === "d") healthScore = 70;
  else if (nutrigrade === "e") healthScore = 85;
  else healthScore = 50; // unknown

  // increase score based on specific nutriments (per 100g)
  const sugar = parseFloat(nutriments["sugars_100g"] ?? nutriments["sugars"] ?? 0);
  const salt = parseFloat(nutriments["salt_100g"] ?? nutriments["salt"] ?? nutriments["sodium_100g"] ?? 0);
  const fat = parseFloat(nutriments["fat_100g"] ?? 0);

  // add penalties
  healthScore += clamp((sugar / 10) * 5, 0, 30); // sugar contributes up to +30
  healthScore += clamp((salt / 1) * 10, 0, 20);   // salt contributes up to +20
  healthScore += clamp((fat / 50) * 10, 0, 15);   // fat contributes up to +15

  // ingredient-based penalties (preservatives, trans fats, palm oil keywords)
  const ingredientsText = (p.ingredients_text || "").toLowerCase();
  const badKeywords = ["palm", "hydrogenated", "trans", "gluten", "sodium nitrite", "e211", "e202", "e250"];
  let keywordPenalty = 0;
  for (const kw of badKeywords) {
    if (ingredientsText.includes(kw)) keywordPenalty += 8;
  }
  healthScore += clamp(keywordPenalty, 0, 40);

  healthScore = clamp(Math.round(healthScore), 0, 100);

  let healthRisk = "Unknown";
  if (healthScore <= 30) healthRisk = "Safe";
  else if (healthScore <= 60) healthRisk = "Moderate";
  else healthRisk = "Harmful";

  // --- Environmental heuristics
  let envScore = 50;
  const ecoscore = (p.ecoscore || "").toLowerCase();
  if (ecoscore === "a") envScore = 10;
  else if (ecoscore === "b") envScore = 25;
  else if (ecoscore === "c") envScore = 45;
  else if (ecoscore === "d") envScore = 65;
  else if (ecoscore === "e") envScore = 85;
  else envScore = 50;

  const packaging = (p.packaging || "").toLowerCase();
  if (packaging.includes("plastic")) envScore += 25;
  if (packaging.includes("glass")) envScore -= 10;
  if (packaging.includes("cardboard") || packaging.includes("box")) envScore -= 5;
  if (packaging.includes("aluminium") || packaging.includes("can")) envScore += 10;

  // ingredients linked to deforestation (palm oil)
  if (ingredientsText.includes("palm")) envScore += 20;

  envScore = clamp(Math.round(envScore), 0, 100);

  let environmentImpact = "Unknown";
  if (envScore <= 30) environmentImpact = "Low";
  else if (envScore <= 60) environmentImpact = "Medium";
  else environmentImpact = "High";

  // Build a user-friendly summary
  const summary = {
    healthScore,
    healthRisk,
    envScore,
    environmentImpact,
    reasons: {
      nutrigrade: nutrigrade || "unknown",
      sugar_100g: sugar || 0,
      salt_100g: salt || 0,
      fat_100g: fat || 0,
      packaging: p.packaging || "",
      keywordsFound: badKeywords.filter(k => ingredientsText.includes(k))
    }
  };

  return summary;
}

export default analyze;
