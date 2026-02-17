import { Brain, TrendingUp, Leaf, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MLAssessmentCardProps {
  rule_based_health_label?: number;
  ml_health_label?: number | string;
  eco_label?: number;
  environmental_impact?: string;
}

// Convert numeric labels to human-readable text
const healthLabelText = {
  0: "Healthy",
  1: "Moderate Risk",
  2: "High Risk"
};

const ecoLabelText = {
  0: "Low Environmental Impact",
  1: "Moderate Environmental Impact",
  2: "High Environmental Impact"
};

// Color mapping for labels
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

const isMLAvailable = (ml_health_label: number | string | undefined): boolean => {
  return typeof ml_health_label === "number" || 
         (typeof ml_health_label === "string" && ["0", "1", "2"].includes(ml_health_label));
};

export const MLAssessmentCard = ({
  rule_based_health_label,
  ml_health_label,
  eco_label,
  environmental_impact
}: MLAssessmentCardProps) => {
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
        {/* Health Assessment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Health Assessment</span>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            {/* Rule-Based Assessment */}
            {rule_based_health_label !== undefined && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">Rule-Based Analysis</p>
                <Badge className={`${getHealthLabelColor(rule_based_health_label)} text-sm font-semibold px-3 py-1 w-full justify-center`}>
                  {healthLabelText[rule_based_health_label as keyof typeof healthLabelText] || "Unknown"}
                </Badge>
              </div>
            )}

            {/* ML-Based Assessment */}
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">AI Prediction</p>
              {mlAvailable && typeof ml_health_label === "number" ? (
                <Badge className={`${getHealthLabelColor(ml_health_label)} text-sm font-semibold px-3 py-1 w-full justify-center`}>
                  {healthLabelText[ml_health_label as keyof typeof healthLabelText] || "Unknown"}
                </Badge>
              ) : (
                <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-3 py-2 flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 text-yellow-700" />
                  <span className="text-xs text-yellow-700 font-medium">Temporarily unavailable</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Environmental Assessment */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Leaf className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Environmental Impact</span>
          </div>

          {eco_label !== undefined && (
            <Badge className={`${getEcoLabelColor(eco_label)} text-sm font-semibold px-3 py-1`}>
              {ecoLabelText[eco_label as keyof typeof ecoLabelText] || "Unknown"}
            </Badge>
          )}

          {environmental_impact && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <p className="text-sm text-foreground">{environmental_impact}</p>
            </div>
          )}
        </div>

        {/* ML Model Caption */}
        {mlAvailable && (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
            <p className="text-xs text-blue-800">
              💡 <span className="font-medium">ML model</span> trained on real scanned product data
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
