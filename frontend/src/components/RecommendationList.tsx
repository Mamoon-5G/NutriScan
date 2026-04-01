import { useState } from "react";
import { Package, Leaf, TrendingUp, Star, ChevronDown, ChevronUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

/**
 * Alternative product recommendation
 */
export interface ProductRecommendation {
  name: string;
  brand?: string;
  image_url?: string;
  reason: string;
  rating?: number;
  eco_friendly?: boolean;
  price?: string;
}

/**
 * Props for RecommendationList component
 */
export interface RecommendationListProps {
  title?: string;
  recommendations: ProductRecommendation[];
  className?: string;
}

/**
 * Single recommendation card
 */
const RecommendationCard = ({ recommendation }: { recommendation: ProductRecommendation }) => {
  return (
    <Card className="overflow-hidden border-border/50 shadow-sm hover:shadow-md transition-all duration-300">
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Product Image */}
          <div className="shrink-0">
            <div className="h-24 w-24 rounded-lg bg-muted/50 flex items-center justify-center overflow-hidden">
              {recommendation.image_url ? (
                <img
                  src={recommendation.image_url}
                  alt={recommendation.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground" />
              )}
            </div>
          </div>

          {/* Product Info */}
          <div className="flex-1 space-y-2">
            <div>
              <h4 className="font-semibold text-foreground">{recommendation.name}</h4>
              {recommendation.brand && (
                <p className="text-xs text-muted-foreground">{recommendation.brand}</p>
              )}
            </div>

            {/* Rating and Eco Badge */}
            <div className="flex flex-wrap items-center gap-2">
              {recommendation.rating && (
                <div className="flex items-center gap-1 text-amber-500">
                  <Star className="h-3 w-3 fill-amber-500" />
                  <span className="text-xs font-medium">{recommendation.rating}</span>
                </div>
              )}
              {recommendation.eco_friendly && (
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50">
                  <Leaf className="h-3 w-3 mr-1" />
                  Eco-Friendly
                </Badge>
              )}
            </div>

            {/* Reason - Collapsible on mobile */}
            <div className="mt-2">
              <p className="text-sm text-muted-foreground line-clamp-2">
                {recommendation.reason}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

/**
 * Recommendation List Component
 * Shows alternative products when main product is classified as Moderate or High harm
 */
export const RecommendationList = ({
  title = "Healthier Alternatives",
  recommendations = [],
  className = ""
}: RecommendationListProps) => {
  const [showAll, setShowAll] = useState(false);

  // Show only first 2 on mobile, all on desktop
  const visibleRecommendations = showAll ? recommendations : recommendations.slice(0, 2);

  if (recommendations.length === 0) {
    return null;
  }

  return (
    <Card className={`shadow-medium border-border/50 ${className}`}>
      <CardContent className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          </div>
          <Badge variant="secondary" className="hidden sm:inline-flex">
            {recommendations.length} alternatives found
          </Badge>
        </div>

        {/* Recommendations Grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {visibleRecommendations.map((rec, index) => (
            <RecommendationCard key={index} recommendation={rec} />
          ))}
        </div>

        {/* Show More Button (only visible when some are hidden) */}
        {recommendations.length > 2 && !showAll && (
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(true)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              Show all {recommendations.length} alternatives
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        )}

        {showAll && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setShowAll(false)}
              className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Show less
              <ChevronUp className="h-4 w-4" />
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
