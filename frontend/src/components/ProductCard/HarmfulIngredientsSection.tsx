import { AlertTriangle } from "lucide-react";
import type { ProductData } from "@/types/product";
import { IngredientExpandable } from "./IngredientExpandable";

export const HarmfulIngredientsSection = ({ product }: { product: ProductData }) => {
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
      <div className="space-y-3">
        {product.harmful_ingredients_details.map((ingredient, index) => (
          <IngredientExpandable key={`${ingredient.code}-${index}`} ingredient={ingredient} index={index} />
        ))}
      </div>
    </div>
  );
};
