import { Package, Award, Leaf, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";
import type { ProductData } from "@/types/product";
import { getGradeColor } from "@/lib/utils/productUtils";
import { ImpactBadge, parseEnvironmentalImpact } from "@/components/ImpactBadge";

export const ProductInfoSummary = ({ product }: { product: ProductData }) => {
  return (
    <div className="space-y-6">
      {/* Product Image and Basic Info */}
      <div className="flex flex-col sm:flex-row gap-6">
        {product.image_url ? (
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="shrink-0 mx-auto sm:mx-0"
          >
            <div className="relative p-1 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 shadow-soft">
              <img
                src={product.image_url}
                alt={product.product_name || "Product"}
                className="h-40 w-40 rounded-xl object-cover shadow-inner"
              />
            </div>
          </motion.div>
        ) : (
          <div className="h-40 w-40 rounded-2xl bg-muted flex items-center justify-center shrink-0 mx-auto sm:mx-0">
             <Package className="h-16 w-16 text-muted-foreground opacity-20" />
          </div>
        )}
        <div className="flex-1 space-y-4 text-center sm:text-left">
          <div className="space-y-1">
            <h3 className="text-3xl font-bold text-foreground tracking-tight leading-tight">
              {product.product_name || "Unknown Product"}
            </h3>
            {product.brands && (
              <p className="text-md text-muted-foreground font-medium">
                by <span className="text-primary/80">{product.brands}</span>
              </p>
            )}
          </div>

          {/* Unified Score Summary Pills */}
          {product.unified_score && (
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              {product.unified_score.health_score && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/20 border border-border/50 shadow-sm">
                  <CheckCircle className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Health: {product.unified_score.health_score}</span>
                </div>
              )}
              {product.unified_score.overall_eco_score && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/50 dark:bg-black/20 border border-border/50 shadow-sm">
                  <Leaf className="h-4 w-4 text-primary" />
                  <span className="text-xs font-bold uppercase tracking-wider">Eco: {product.unified_score.overall_eco_score}</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Grade Display Grid */}
      <div className="grid grid-cols-2 gap-4 pt-2">
        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/30 dark:bg-black/20 p-5 shadow-soft group"
        >
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-muted-foreground">
                <Award className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Nutrition Grade</span>
             </div>
             <div className={`h-16 w-16 flex items-center justify-center rounded-2xl text-3xl font-black shadow-lg ${getGradeColor(product.nutrition_grade)} transition-transform group-hover:scale-110 duration-300`}>
                {product.nutrition_grade?.toUpperCase() || "?"}
             </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="relative overflow-hidden rounded-2xl border border-border/50 bg-white/30 dark:bg-black/20 p-5 shadow-soft group"
        >
          <div className="flex flex-col items-center gap-4">
             <div className="flex items-center gap-2 text-muted-foreground">
                <Leaf className="h-4 w-4" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Eco Score</span>
             </div>
             <div className={`h-16 w-16 flex items-center justify-center rounded-2xl text-3xl font-black shadow-lg ${getGradeColor(product.ecoscore_grade)} transition-transform group-hover:scale-110 duration-300`}>
                {product.ecoscore_grade?.toUpperCase() || "?"}
             </div>
          </div>
        </motion.div>
      </div>

      {/* Environmental Impact Summary */}
      {product.environmental_impact && (
        <div className="rounded-2xl border border-border/50 bg-white/30 dark:bg-black/20 p-6 shadow-soft space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Leaf className="h-4 w-4" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Sustainability Analysis</span>
            </div>
            <ImpactBadge
              level={parseEnvironmentalImpact(product.environmental_impact)}
              type="environment"
            />
          </div>
          <p className="text-sm text-foreground/80 leading-relaxed italic">
            "{product.environmental_impact}"
          </p>
        </div>
      )}
    </div>
  );
};
