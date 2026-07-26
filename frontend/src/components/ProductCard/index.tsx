import { Package, AlertCircle, AlertTriangle, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import type { ProductData } from "@/types/product";
import { ProductInfoSummary } from "./ProductInfoSummary";
import { HarmfulIngredientsSection } from "./HarmfulIngredientsSection";
import { RecommendationSection } from "./RecommendationSection";

interface ProductCardProps {
  product: ProductData;
}

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
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <Card className="shadow-premium border-border/50 glass overflow-hidden rounded-2xl">
        <CardHeader className="bg-primary/5 border-b border-border/50 py-6">
          <CardTitle className="flex items-center gap-3 text-2xl font-bold font-display">
            <div className="p-2 rounded-xl bg-primary/20 text-primary">
              <Package className="h-6 w-6" />
            </div>
            Product Intelligence
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
    </motion.div>
  );
};
