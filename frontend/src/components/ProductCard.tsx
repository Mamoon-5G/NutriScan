import { Package, Award, Leaf, AlertTriangle, ChevronDown, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { ImpactBadge, getImpactColorClass, parseEnvironmentalImpact } from "./ImpactBadge";
import { RecommendationList } from "./RecommendationList";
import type { ProductRecommendation } from "./RecommendationList";

/**
 * Ingredient detail interface
 */
export interface IngredientDetail {
  code: string;
  name: string;
  category: string;
  description: string;
  why_harmful: string;
  health_effects: string[];
  environmental_impact: string;
  usage: string;
  risk_level: string;
  alternatives: string;
}

/**
 * Product data interface
 */
export interface ProductData {
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  harmful_ingredients?: string[];
  harmful_ingredients_details?: IngredientDetail[];
  allergens?: string;
  nova_group?: number;
  environmental_impact?: string;
  unified_score?: {
    health_score?: 'High' | 'Moderate' | 'Low';
    overall_eco_score?: 'High' | 'Moderate' | 'Low';
    confidence?: number;
  };
  ml_health_label?: number | string;
  rule_based_health_label?: number;
}

/**
 * Props for ProductCard component
 */
interface ProductCardProps {
  product: ProductData;
}

/**
 * Grade color mapping
 */
const getGradeColor = (grade: string | undefined) => {
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

/**
 * Get risk level color class
 */
const getRiskLevelColor = (riskLevel: string | undefined) => {
  if (!riskLevel) return "text-muted-foreground";

  const level = riskLevel.toLowerCase();
  if (level.includes("high")) return "text-red-600 font-semibold";
  if (level.includes("moderate-high")) return "text-orange-600 font-semibold";
  if (level.includes("moderate")) return "text-yellow-600 font-medium";
  if (level.includes("low-moderate")) return "text-yellow-500";
  if (level.includes("low")) return "text-green-600";

  return "text-muted-foreground";
};

/**
 * Check if product needs recommendations (Moderately or Highly harmful)
 */
const needsRecommendations = (product: ProductData): boolean => {
  const impactLevel = parseEnvironmentalImpact(product.environmental_impact);
  const healthScore = product.unified_score?.health_score;
  const ecoScore = product.unified_score?.overall_eco_score;

  // Check if environmental impact is Moderate or High
  if (impactLevel === "Moderate" || impactLevel === "High") {
    return true;
  }

  // Check if health score is Moderate or High
  if (healthScore === "Moderate" || healthScore === "High") {
    return true;
  }

  // Check if eco score is Moderate or High (C or worse)
  if (ecoScore === "Moderate" || ecoScore === "High") {
    return true;
  }

  // Check rule-based health label
  if (product.rule_based_health_label === 1 || product.rule_based_health_label === 2) {
    return true;
  }

  // Check ML health label
  const mlLabel = typeof product.ml_health_label === "string" ? parseInt(product.ml_health_label) : product.ml_health_label;
  if (mlLabel === 1 || mlLabel === 2) {
    return true;
  }

  return false;
};

/**
 * Generate alternative product recommendations based on product type
 */
const generateRecommendations = (product: ProductData): ProductRecommendation[] => {
  const productName = product.product_name?.toLowerCase() || "";
  const grade = product.nutrition_grade?.toUpperCase() || "";

  // Default healthy alternatives
  const baseRecommendations: ProductRecommendation[] = [
    {
      name: "Organic Whole Foods",
      brand: "Nature's Best",
      reason: "No added sugars, eco-friendly packaging, whole food ingredients",
      rating: 4.8,
      eco_friendly: true,
      price: "$12.99"
    },
    {
      name: "Fresh Seasonal Produce",
      brand: "Farm Direct",
      reason: "Locally sourced, low carbon footprint, no preservatives",
      rating: 4.7,
      eco_friendly: true,
      price: "$8.99"
    }
  ];

  // Specialized recommendations based on product type
  if (productName.includes("sugar") || productName.includes("sweet")) {
    return [
      ...baseRecommendations,
      {
        name: "Natural Fruit Snacks",
        brand: "Healthy Choices",
        reason: "No added sugar, rich in fiber, natural sweetness",
        rating: 4.6,
        eco_friendly: true,
        price: "$6.99"
      }
    ];
  }

  if (productName.includes("plastic") || productName.includes("packaged")) {
    return [
      ...baseRecommendations,
      {
        name: "Bulk Fresh Products",
        brand: "Eco Marketplace",
        reason: "Zero plastic packaging, sustainable sourcing",
        rating: 4.5,
        eco_friendly: true,
        price: "$10.99"
      }
    ];
  }

  if (grade === "D" || grade === "E") {
    return [
      ...baseRecommendations,
      {
        name: "Premium Organic Option",
        brand: "Top Quality",
        reason: "Highest quality ingredients, certified organic",
        rating: 4.9,
        eco_friendly: true,
        price: "$15.99"
      }
    ];
  }

  // Generic recommendations
  return [
    ...baseRecommendations,
    {
      name: "Eco-Friendly Alternative",
      brand: "Green Products",
      reason: "Sustainably sourced, biodegradable packaging",
      rating: 4.6,
      eco_friendly: true,
      price: "$9.99"
    }
  ];
};

/**
 * Expandable ingredient card
 */
const IngredientExpandable = ({ ingredient }: { ingredient: IngredientDetail }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="border border-border/50 rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <div>
              <h4 className="font-semibold text-foreground">{ingredient.name}</h4>
              <p className="text-xs text-muted-foreground mt-1">{ingredient.code.toUpperCase()} • {ingredient.category}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-semibold ${getRiskLevelColor(ingredient.risk_level)}`}>
            {ingredient.risk_level}
          </span>
          <ChevronDown
            size={20}
            className={`transition-transform ${expanded ? 'rotate-180' : ''} text-muted-foreground`}
          />
        </div>
      </button>

      {expanded && (
        <div className="bg-muted/30 border-t border-border/50 p-4 space-y-4">
          <div>
            <h5 className="text-sm font-semibold text-foreground mb-1">Description</h5>
            <p className="text-sm text-muted-foreground">{ingredient.description}</p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-destructive mb-2">Why It's Harmful</h5>
            <p className="text-sm text-foreground bg-destructive/10 rounded p-3 border-l-4 border-destructive">
              {ingredient.why_harmful}
            </p>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-foreground mb-2">Health Effects</h5>
            <ul className="space-y-1">
              {ingredient.health_effects.map((effect, idx) => (
                <li key={idx} className="text-sm text-foreground flex gap-2">
                  <span className="text-destructive flex-shrink-0">•</span>
                  <span>{effect}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-1">Environmental Impact</h5>
              <p className="text-sm text-foreground">{ingredient.environmental_impact}</p>
            </div>
            <div>
              <h5 className="text-xs font-semibold text-muted-foreground mb-1">Common Usage</h5>
              <p className="text-sm text-foreground">{ingredient.usage}</p>
            </div>
          </div>

          <div>
            <h5 className="text-sm font-semibold text-primary mb-1">Healthier Alternatives</h5>
            <p className="text-sm text-foreground bg-primary/10 rounded p-3 border-l-4 border-primary">
              {ingredient.alternatives}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Product info summary card
 */
const ProductInfoSummary = ({ product }: { product: ProductData }) => {
  return (
    <div className="space-y-4">
      {/* Product Image and Basic Info */}
      <div className="flex flex-col sm:flex-row gap-4">
        {product.image_url && (
          <div className="flex-shrink-0">
            <img
              src={product.image_url}
              alt={product.product_name || "Product"}
              className="h-32 w-32 rounded-lg object-cover shadow-soft"
            />
          </div>
        )}
        <div className="flex-1 space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {product.product_name || "Unknown Product"}
          </h3>
          {product.brands && (
            <p className="text-sm text-muted-foreground">
              <span className="font-medium">Brand:</span> {product.brands}
            </p>
          )}
        </div>
      </div>

      {/* Nutrition and Eco Score */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Nutrition Grade</span>
          </div>
          <Badge
            variant="outline"
            className={`${getGradeColor(product.nutrition_grade)} text-lg font-bold px-4 py-2`}
          >
            {product.nutrition_grade?.toUpperCase() || "N/A"}
          </Badge>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Eco-Score</span>
          </div>
          <Badge
            variant="outline"
            className={`${getGradeColor(product.ecoscore_grade)} text-lg font-bold px-4 py-2`}
          >
            {product.ecoscore_grade?.toUpperCase() || "N/A"}
          </Badge>
        </div>
      </div>

      {/* Environmental Impact Summary */}
      {product.environmental_impact && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Environmental Impact</span>
          </div>
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <ImpactBadge
              level={parseEnvironmentalImpact(product.environmental_impact)}
              type="environment"
            />
            <p className="text-sm text-muted-foreground mt-2">
              {product.environmental_impact}
            </p>
          </div>
        </div>
      )}

      {/* Unified Score Summary */}
      {product.unified_score && (
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Overall Assessment</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {product.unified_score.health_score && (
              <Badge variant="outline" className="capitalize">
                <CheckCircle className="h-3 w-3 mr-1" />
                Health: {product.unified_score.health_score}
              </Badge>
            )}
            {product.unified_score.overall_eco_score && (
              <Badge variant="outline" className="capitalize">
                <Leaf className="h-3 w-3 mr-1" />
                Eco: {product.unified_score.overall_eco_score}
              </Badge>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Harmful ingredients section
 */
const HarmfulIngredientsSection = ({ product }: { product: ProductData }) => {
  if (!product.harmful_ingredients_details || product.harmful_ingredients_details.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
      <div className="flex items-center gap-2">
        <AlertTriangle className="h-5 w-5 text-destructive" />
        <span className="font-semibold text-destructive">
          Harmful Ingredients Detected ({product.harmful_ingredients_details.length})
        </span>
      </div>
      <p className="text-xs text-muted-foreground mb-3">
        Click on each ingredient to see detailed information about why it's harmful and healthier alternatives.
      </p>
      <div className="space-y-2">
        {product.harmful_ingredients_details.map((ingredient, index) => (
          <IngredientExpandable key={`${ingredient.code}-${index}`} ingredient={ingredient} />
        ))}
      </div>
    </div>
  );
};

/**
 * Recommendation Section (shown for harmful products)
 */
const RecommendationSection = ({ product }: { product: ProductData }) => {
  const recommendations = generateRecommendations(product);

  if (!needsRecommendations(product)) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Leaf className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-green-700">Recommended Alternatives</span>
      </div>
      <p className="text-sm text-muted-foreground">
        Based on the analysis, consider these healthier and more eco-friendly options.
      </p>
      <RecommendationList
        recommendations={recommendations}
        className="border-green-200/30"
      />
    </div>
  );
};

/**
 * ProductCard Component
 *
 * Displays comprehensive product information including:
 * - Product details and basic info
 * - Nutrition and eco scores
 * - Environmental impact assessment
 * - Harmful ingredients with detailed breakdown
 * - Recommendations for healthier alternatives (when applicable)
 */
export const ProductCard = ({ product }: ProductCardProps) => {
  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Package className="h-5 w-5 text-primary" />
          Product Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Product Info Summary */}
        <ProductInfoSummary product={product} />

        {/* Harmful Ingredients */}
        <HarmfulIngredientsSection product={product} />

        {/* Recommendations (only for harmful products) */}
        <RecommendationSection product={product} />

        {/* Allergens */}
        {product.allergens && (
          <div className="space-y-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              Allergens:
            </span>
            <p className="text-sm text-muted-foreground">{product.allergens}</p>
          </div>
        )}

        {/* NOVA Group */}
        {product.nova_group && (
          <div className="space-y-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
              Processing Level:
            </span>
            <Badge variant="secondary">NOVA Group {product.nova_group}</Badge>
          </div>
        )}

        {/* Ingredients */}
        {product.ingredients_text && (
          <div className="space-y-2">
            <span className="text-sm font-medium flex items-center gap-2">
              <Leaf className="h-4 w-4 text-muted-foreground" />
              Ingredients:
            </span>
            <p className="text-sm text-muted-foreground line-clamp-4">{product.ingredients_text}</p>
          </div>
        )}

        {/* Loading State */}
        {!product.product_name && (
          <div className="flex items-center justify-center py-8">
            <div className="text-center space-y-3">
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-muted/50 animate-spin">
                <Package className="h-6 w-6 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">Loading product data...</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
