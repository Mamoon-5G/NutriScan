import type { ProductData } from "@/types/product";
import { parseEnvironmentalImpact } from "@/components/ImpactBadge";
import type { ProductRecommendation } from "@/components/RecommendationList";

export const getGradeColor = (grade: string | undefined) => {
  if (!grade) return "bg-muted text-muted-foreground";

  const gradeUpper = grade.toUpperCase();
  switch (gradeUpper) {
    case "A":
      return "bg-[hsl(var(--grade-a))] text-white";
    case "B":
      return "bg-[hsl(var(--grade-b))] text-white";
    case "C":
      return "bg-[hsl(var(--grade-c))] text-white";
    case "D":
      return "bg-[hsl(var(--grade-d))] text-white";
    case "E":
      return "bg-[hsl(var(--grade-e))] text-white";
    default:
      return "bg-muted text-muted-foreground";
  }
};

export const getRiskLevelColor = (riskLevel: string | undefined) => {
  if (!riskLevel) return "text-muted-foreground";

  const level = riskLevel.toLowerCase();
  if (level.includes("high")) return "text-red-600 font-semibold";
  if (level.includes("moderate-high")) return "text-orange-600 font-semibold";
  if (level.includes("moderate")) return "text-yellow-600 font-medium";
  if (level.includes("low-moderate")) return "text-yellow-500";
  if (level.includes("low")) return "text-green-600";

  return "text-muted-foreground";
};

export const normalizeRecommendation = (candidate: unknown): ProductRecommendation | null => {
  if (!candidate || typeof candidate !== "object") return null;

  const item = candidate as Record<string, unknown>;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  if (!name) return null;

  return {
    name,
    brand: typeof item.brand === "string" && item.brand.trim().length > 0 ? item.brand.trim() : undefined,
    image_url: typeof item.image_url === "string" && item.image_url.trim().length > 0 ? item.image_url.trim() : undefined,
    reason: typeof item.reason === "string" && item.reason.trim().length > 0
      ? item.reason.trim()
      : "Suggested by the LLM as a healthier alternative.",
    rating: typeof item.rating === "number" && Number.isFinite(item.rating) ? item.rating : undefined,
    eco_friendly: typeof item.eco_friendly === "boolean" ? item.eco_friendly : undefined,
    price: typeof item.price === "string" && item.price.trim().length > 0 ? item.price.trim() : undefined,
  };
};

export const buildRecommendationInput = (product: ProductData) => ({
  product_name: product.product_name || "",
  brands: product.brands || "",
  nutrition_grade: product.nutrition_grade || "",
  ecoscore_grade: product.ecoscore_grade || "",
  ingredients_text: product.ingredients_text || "",
  harmful_ingredients: product.harmful_ingredients || [],
  harmful_ingredients_details: (product.harmful_ingredients_details || []).slice(0, 5).map((ingredient) => ({
    name: ingredient.name,
    category: ingredient.category,
    risk_level: ingredient.risk_level,
    alternatives: ingredient.alternatives,
  })),
  environmental_impact: product.environmental_impact || "",
  unified_score: product.unified_score || {},
  ml_health_label: product.ml_health_label,
  rule_based_health_label: product.rule_based_health_label,
});

export const needsRecommendations = (product: ProductData): boolean => {
  const impactLevel = parseEnvironmentalImpact(product.environmental_impact);
  const healthScore = product.unified_score?.health_score;
  const ecoScore = product.unified_score?.overall_eco_score;

  if (impactLevel === "Moderate" || impactLevel === "High") {
    return true;
  }

  if (healthScore === "Moderate" || healthScore === "High") {
    return true;
  }

  if (ecoScore === "Moderate" || ecoScore === "High") {
    return true;
  }

  if (product.rule_based_health_label === 1 || product.rule_based_health_label === 2) {
    return true;
  }

  const mlLabel = typeof product.ml_health_label === "string" ? parseInt(product.ml_health_label) : product.ml_health_label;
  if (mlLabel === 1 || mlLabel === 2) {
    return true;
  }

  return false;
};
