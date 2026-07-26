import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { IngredientDetail } from "@/types/product";
import { getRiskLevelColor } from "@/lib/utils/productUtils";

export const IngredientExpandable = ({ ingredient, index }: { ingredient: IngredientDetail; index: number }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1 }}
      className="border border-border/50 rounded-xl overflow-hidden glass hover:border-destructive/30 transition-colors"
    >
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-destructive/5 transition-colors"
      >
        <div className="flex-1 text-left">
          <div className="flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${ingredient.risk_level.toLowerCase().includes('high') ? 'bg-destructive animate-pulse' : 'bg-orange-400'}`} />
            <div>
              <h4 className="font-bold text-foreground text-sm">{ingredient.name}</h4>
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground mt-0.5 font-bold">{ingredient.code.toUpperCase()} • {ingredient.category}</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant="outline" className={`text-[10px] font-bold px-2 py-0 h-5 border-none bg-muted/50 ${getRiskLevelColor(ingredient.risk_level)}`}>
            {ingredient.risk_level}
          </Badge>
          <ChevronDown
            size={16}
            className={`transition-transform duration-300 ${expanded ? 'rotate-180' : ''} text-muted-foreground`}
          />
        </div>
      </button>

      <AnimatePresence>
        {expanded && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="bg-muted/30 border-t border-border/50 p-5 space-y-5">
              <div className="space-y-1">
                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Description</h5>
                <p className="text-sm text-foreground leading-relaxed">{ingredient.description}</p>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-widest text-destructive">Why It's Harmful</h5>
                <div className="text-sm text-foreground bg-destructive/5 rounded-xl p-4 border-l-4 border-destructive shadow-sm">
                  {ingredient.why_harmful}
                </div>
              </div>

              <div className="space-y-2">
                <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Health Effects</h5>
                <div className="flex flex-wrap gap-2">
                  {ingredient.health_effects.map((effect, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-white/50 dark:bg-black/20 text-foreground/80 border-none px-3 py-1">
                       {effect}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="space-y-1">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Environmental Impact</h5>
                  <p className="text-sm text-foreground">{ingredient.environmental_impact}</p>
                </div>
                <div className="space-y-1">
                  <h5 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Common Usage</h5>
                  <p className="text-sm text-foreground">{ingredient.usage}</p>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <h5 className="text-xs font-bold uppercase tracking-widest text-primary">Healthier Alternatives</h5>
                <div className="text-sm text-foreground bg-primary/5 rounded-xl p-4 border-l-4 border-primary shadow-sm">
                  {ingredient.alternatives}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};
