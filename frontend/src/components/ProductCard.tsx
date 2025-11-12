import { Package, Award, Leaf, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface ProductData {
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  harmful_ingredients?: string[];
  allergens?: string;
  nova_group?: number;
}

interface ProductCardProps {
  product: ProductData;
}

// Grade color mapping
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
        {/* Product Image and Basic Info */}
        <div className="flex flex-col gap-4 sm:flex-row">
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

        {/* Harmful Ingredients */}
        {product.harmful_ingredients && product.harmful_ingredients.length > 0 && (
          <div className="space-y-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="font-medium text-destructive">Harmful Ingredients Detected</span>
            </div>
            <ul className="ml-6 list-disc space-y-1">
              {product.harmful_ingredients.map((ingredient, index) => (
                <li key={index} className="text-sm text-foreground">
                  {ingredient}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Allergens */}
        {product.allergens && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Allergens:</span>
            <p className="text-sm text-muted-foreground">{product.allergens}</p>
          </div>
        )}

        {/* NOVA Group */}
        {product.nova_group && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Processing Level:</span>
            <Badge variant="secondary">NOVA Group {product.nova_group}</Badge>
          </div>
        )}

        {/* Ingredients */}
        {product.ingredients_text && (
          <div className="space-y-2">
            <span className="text-sm font-medium">Ingredients:</span>
            <p className="text-sm text-muted-foreground line-clamp-4">{product.ingredients_text}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
