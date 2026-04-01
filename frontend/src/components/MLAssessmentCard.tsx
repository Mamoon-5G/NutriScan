import { useEffect, useState } from "react";
import { Brain, TrendingUp, Leaf, AlertCircle, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactBadge, parseEnvironmentalImpact, parseUnifiedScore } from "./ImpactBadge";

/**
 * Unified score interface for health and eco assessments
 */
interface UnifiedScore {
  overall_eco_score?: 'High' | 'Moderate' | 'Low';
  health_score?: 'High' | 'Moderate' | 'Low';
  confidence?: number;
}

/**
 * Props for MLAssessmentCard component
 */
interface MLAssessmentCardProps {
  unified_score?: UnifiedScore;
  rule_based_health_label?: number;
  ml_health_label?: number | string;
  eco_label?: number;
  environmental_impact?: string;
  isLoading?: boolean;
  error?: string | null;
}

// Convert numeric labels to human-readable text
const healthLabelText: Record<number, string> = {
  0: "Healthy",
  1: "Moderate Risk",
  2: "High Risk"
};

const ecoLabelText: Record<number, string> = {
  0: "Low Environmental Impact",
  1: "Moderate Environmental Impact",
  2: "High Environmental Impact"
};

/**
 * Determine environmental impact level from various data sources
 * Priority: environmental_impact string > unified_score > eco_label
 */
const getEnvironmentalImpactLevel = ({
  environmental_impact,
  unified_score,
  eco_label
}: {
  environmental_impact?: string;
  unified_score?: UnifiedScore;
  eco_label?: number;
}): { level: 'Low' | 'Moderate' | 'High'; source: string; description: string } => {
  // Priority 1: environmental_impact string (from backend)
  if (environmental_impact) {
    const level = parseEnvironmentalImpact(environmental_impact);
    return {
      level,
      source: "ingredients",
      description: environmental_impact
    };
  }

  // Priority 2: unified_score.overall_eco_score
  if (unified_score?.overall_eco_score) {
    const level = parseUnifiedScore(unified_score.overall_eco_score);
    return {
      level,
      source: "unified",
      description: `${level} - Based on nutritional and environmental factors`
    };
  }

  // Priority 3: eco_label
  if (eco_label !== undefined) {
    const levelMap: Record<number, 'Low' | 'Moderate' | 'High'> = {
      0: "Low",
      1: "Moderate",
      2: "High"
    };
    const level = levelMap[eco_label] || "Moderate";
    return {
      level,
      source: "eco_label",
      description: ecoLabelText[eco_label] || "Environmental impact assessment"
    };
  }

  // Default fallback
  return {
    level: "Moderate",
    source: "default",
    description: "Insufficient data for environmental assessment"
  };
};

/**
 * Determine health impact level from various data sources
 * Priority: unified_score > ml_health_label > rule_based_health_label
 */
const getHealthImpactLevel = ({
  unified_score,
  ml_health_label,
  rule_based_health_label
}: {
  unified_score?: UnifiedScore;
  ml_health_label?: number | string;
  rule_based_health_label?: number;
}): { level: 'Low' | 'Moderate' | 'High'; source: string; description: string } => {
  // Priority 1: unified_score.health_score
  if (unified_score?.health_score) {
    const level = parseUnifiedScore(unified_score.health_score);
    return {
      level,
      source: "unified",
      description: `${level} - Comprehensive health assessment`
    };
  }

  // Priority 2: ml_health_label
  if (ml_health_label !== undefined && ml_health_label !== "unavailable") {
    const numLabel = typeof ml_health_label === "string" ? parseInt(ml_health_label) : ml_health_label;
    if (!isNaN(numLabel) && numLabel >= 0 && numLabel <= 2) {
      const labelMap: Record<number, 'Low' | 'Moderate' | 'High'> = {
        0: "Low",
        1: "Moderate",
        2: "High"
      };
      const level = labelMap[numLabel] || "Moderate";
      return {
        level,
        source: "ml",
        description: healthLabelText[numLabel] || "AI Health Prediction"
      };
    }
  }

  // Priority 3: rule_based_health_label
  if (rule_based_health_label !== undefined) {
    const labelMap: Record<number, 'Low' | 'Moderate' | 'High'> = {
      0: "Low",
      1: "Moderate",
      2: "High"
    };
    const level = labelMap[rule_based_health_label] || "Moderate";
    return {
      level,
      source: "rule_based",
      description: healthLabelText[rule_based_health_label] || "Rule-based Analysis"
    };
  }

  // Default fallback
  return {
    level: "Moderate",
    source: "default",
    description: "Health assessment unavailable"
  };
};

// Color mapping for numeric labels
const getHealthLabelColor = (label: number | string | undefined) => {
  if (typeof label === "string" && label !== "0" && label !== "1" && label !== "2") {
    return "bg-gray-100 text-gray-700";
  }

  const numLabel = typeof label === "string" ? parseInt(label) : label;

  switch (numLabel) {
    case 0:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-yellow-100 text-yellow-800";
    case 2:
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};

const getEcoLabelColor = (label: number | undefined) => {
  if (label === undefined) return "bg-muted text-muted-foreground";

  switch (label) {
    case 0:
      return "bg-green-100 text-green-800";
    case 1:
      return "bg-yellow-100 text-yellow-800";
    case 2:
      return "bg-red-100 text-red-800";
    default:
      return "bg-muted text-muted-foreground";
  }
};

/**
 * Check if ML health label is available
 */
const isMLAvailable = (ml_health_label: number | string | undefined): boolean => {
  return typeof ml_health_label === "number" ||
    (typeof ml_health_label === "string" && ["0", "1", "2", "unavailable"].includes(ml_health_label));
};

/**
 * MLAssessmentCard - AI Health & Environmental Assessment component
 *
 * Displays comprehensive health and environmental impact assessments
 * with proper conditional rendering based on actual data.
 */
export const MLAssessmentCard = ({
  unified_score,
  rule_based_health_label,
  ml_health_label,
  eco_label,
  environmental_impact,
  isLoading = false,
  error = null
}: MLAssessmentCardProps) => {
  const [healthImpact, setHealthImpact] = useState<{
    level: 'Low' | 'Moderate' | 'High';
    source: string;
    description: string;
  }>({
    level: "Moderate",
    source: "default",
    description: "Loading..."
  });
  const [ecoImpact, setEcoImpact] = useState<{
    level: 'Low' | 'Moderate' | 'High';
    source: string;
    description: string;
  }>({
    level: "Moderate",
    source: "default",
    description: "Loading..."
  });

  // Recalculate impacts when props change
  useEffect(() => {
    if (error) {
      setHealthImpact({ level: "Moderate", source: "error", description: error });
      setEcoImpact({ level: "Moderate", source: "error", description: "Assessment unavailable" });
      return;
    }

    if (isLoading) {
      setHealthImpact({ level: "Moderate", source: "loading", description: "Calculating..." });
      setEcoImpact({ level: "Moderate", source: "loading", description: "Analyzing..." });
      return;
    }

    setHealthImpact(getHealthImpactLevel({ unified_score, ml_health_label, rule_based_health_label }));
    setEcoImpact(getEnvironmentalImpactLevel({ environmental_impact, unified_score, eco_label }));
  }, [unified_score, ml_health_label, rule_based_health_label, eco_label, environmental_impact, isLoading, error]);

  const mlAvailable = isMLAvailable(ml_health_label);

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Brain className="h-5 w-5 text-primary" />
          AI Health & Environmental Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-8 space-y-4">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="text-muted-foreground">Analyzing product data...</p>
          </div>
        )}

        {/* Error State */}
        {error && !isLoading && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
            <AlertCircle className="h-10 w-10 text-destructive mx-auto mb-2" />
            <p className="text-destructive font-medium">Assessment unavailable</p>
            <p className="text-sm text-muted-foreground mt-1">{error}</p>
          </div>
        )}

        {/* Unified Score Assessment */}
        {!isLoading && !error && unified_score && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Comprehensive Assessment</span>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <ImpactBadge
                level={healthImpact.level}
                type="health"
                className="flex-1 justify-center"
              />
              <ImpactBadge
                level={ecoImpact.level}
                type="environment"
                className="flex-1 justify-center"
              />
              <span className="text-xs text-muted-foreground self-center flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-primary animate-pulse"></span>
                Confidence: {Math.round((unified_score.confidence ?? 1) * 100)}%
              </span>
            </div>
          </div>
        )}

        {/* Health Assessment */}
        {!isLoading && !error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Health Analysis</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Rule-Based Assessment */}
              {rule_based_health_label !== undefined && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Rule-Based Analysis</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <Badge className={`${getHealthLabelColor(rule_based_health_label)} text-sm font-semibold w-full justify-center`}>
                      {healthLabelText[rule_based_health_label as keyof typeof healthLabelText] || "Unknown"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      Based on ingredient rules
                    </p>
                  </div>
                </div>
              )}

              {/* ML-Based Assessment */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Prediction</p>
                {mlAvailable && typeof ml_health_label === "number" ? (
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <Badge className={`${getHealthLabelColor(ml_health_label)} text-sm font-semibold w-full justify-center`}>
                      {healthLabelText[ml_health_label as keyof typeof healthLabelText] || "Unknown"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      ML Model Prediction
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-yellow-700" />
                    <span className="text-xs text-yellow-700 font-medium">Temporarily unavailable</span>
                  </div>
                )}
              </div>
            </div>

            {/* Health Impact Summary */}
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm text-foreground">
                <span className="font-medium text-foreground">Assessment:</span> {healthImpact.description}
              </p>
            </div>
          </div>
        )}

        {/* Environmental Assessment */}
        {!isLoading && !error && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Environmental Impact</span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              {/* Eco Label */}
              {eco_label !== undefined && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Product Classification</p>
                  <div className="rounded-lg border border-border bg-muted/30 p-3">
                    <Badge className={`${getEcoLabelColor(eco_label)} text-sm font-semibold w-full justify-center`}>
                      {ecoLabelText[eco_label as keyof typeof ecoLabelText] || "Unknown"}
                    </Badge>
                    <p className="text-xs text-muted-foreground mt-2 text-center">
                      From environmental factors
                    </p>
                  </div>
                </div>
              )}

              {/* Detailed Environmental Impact */}
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Detailed Analysis</p>
                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-sm text-foreground">{ecoImpact.description}</p>
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Based on {ecoImpact.source === "ingredients" ? "ingredients analysis" : ecoImpact.source}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ML Model Caption */}
        {mlAvailable && !isLoading && !error && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800 flex items-center gap-2">
              <span className="inline-block bg-blue-200 rounded-full p-0.5">
                <Brain className="h-3 w-3 text-blue-700" />
              </span>
              <span className="font-medium">ML model</span> trained on real scanned product data
            </p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !error && !unified_score && !ml_health_label && !eco_label && (
          <div className="text-center py-8">
            <div className="h-12 w-12 rounded-full bg-muted/50 flex items-center justify-center mx-auto mb-3">
              <Brain className="h-6 w-6 text-muted-foreground" />
            </div>
            <p className="text-muted-foreground">No assessment data available</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
