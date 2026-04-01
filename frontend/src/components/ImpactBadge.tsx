import { cva } from "class-variance-authority";
import { AlertTriangle, CheckCircle, AlertCircle, Leaf, TrendingDown, TrendingUp } from "lucide-react";

/**
 * Impact level for environmental or health assessments
 */
export type ImpactLevel = "Low" | "Moderate" | "High";

/**
 * Impact type - either "health" or "environment"
 */
export type ImpactType = "health" | "environment";

/**
 * Variants for ImpactBadge based on impact level and type
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-semibold transition-all duration-200",
  {
    variants: {
      level: {
        Low: "bg-green-500/10 text-green-700 border border-green-500/20 hover:bg-green-500/15",
        Moderate: "bg-yellow-500/10 text-yellow-700 border border-yellow-500/20 hover:bg-yellow-500/15",
        High: "bg-red-500/10 text-red-700 border border-red-500/20 hover:bg-red-500/15",
      },
      type: {
        health: "",
        environment: "",
      },
    },
    defaultVariants: {
      level: "Moderate",
      type: "health",
    },
  }
);

/**
 * Icon mapping based on impact level
 */
const getIconForLevel = (level: ImpactLevel, type: ImpactType) => {
  const baseClass = "h-4 w-4";

  if (type === "health") {
    switch (level) {
      case "Low":
        return <CheckCircle className={`${baseClass} text-green-600`} />;
      case "Moderate":
        return <AlertTriangle className={`${baseClass} text-yellow-600`} />;
      case "High":
        return <AlertCircle className={`${baseClass} text-red-600`} />;
    }
  }

  // Environment type
  switch (level) {
    case "Low":
      return <Leaf className={`${baseClass} text-green-600`} />;
    case "Moderate":
      return <TrendingDown className={`${baseClass} text-yellow-600`} />;
    case "High":
      return <TrendingUp className={`${baseClass} text-red-600`} />;
  }
};

/**
 * Display a visual badge indicating impact level
 */
export interface ImpactBadgeProps {
  level: ImpactLevel;
  type?: ImpactType;
  showText?: boolean;
  className?: string;
}

export const ImpactBadge = ({
  level,
  type = "health",
  showText = true,
  className = ""
}: ImpactBadgeProps) => {
  return (
    <span className={badgeVariants({ level, type, className })}>
      {getIconForLevel(level, type)}
      {showText && <span className="capitalize">{type === "health" ? "Health" : "Eco"}: {level}</span>}
    </span>
  );
};

/**
 * Get color class for text based on impact level
 */
export const getImpactColorClass = (level: ImpactLevel, type: ImpactType = "health"): string => {
  const base = type === "health" ? "text-" : "text-";

  switch (level) {
    case "Low":
      return `${base}green-600 dark:${base}green-400`;
    case "Moderate":
      return `${base}yellow-600 dark:${base}yellow-400`;
    case "High":
      return `${base}red-600 dark:${base}red-400`;
  }
};

/**
 * Get background color class based on impact level
 */
export const getImpactBgClass = (level: ImpactLevel, type: ImpactType = "health"): string => {
  const prefix = type === "health" ? "bg-" : "bg-";

  switch (level) {
    case "Low":
      return `${prefix}green-50 dark:${prefix}green-900/20`;
    case "Moderate":
      return `${prefix}yellow-50 dark:${prefix}yellow-900/20`;
    case "High":
      return `${prefix}red-50 dark:${prefix}red-900/20`;
  }
};

/**
 * Parse environmental impact string to ImpactLevel
 */
export const parseEnvironmentalImpact = (impact?: string | null): ImpactLevel => {
  if (!impact) return "Moderate";

  const lower = impact.toLowerCase();

  if (lower.includes("high")) return "High";
  if (lower.includes("moderate")) return "Moderate";
  if (lower.includes("low")) return "Low";

  // Fallback to Moderate if unknown
  return "Moderate";
};

/**
 * Parse unified score to ImpactLevel
 */
export const parseUnifiedScore = (score?: string | null): ImpactLevel => {
  if (!score) return "Moderate";

  const upper = score.toUpperCase();

  if (upper === "HIGH") return "High";
  if (upper === "MODERATE") return "Moderate";
  if (upper === "LOW") return "Low";

  return "Moderate";
};
