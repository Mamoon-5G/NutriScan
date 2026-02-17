import { Brain, TrendingUp, Leaf } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MLAssessmentCardProps {
  rule_based_health_label?: number;
  ml_health_label?: number;
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
const getHealthLabelColor = (label: number | undefined) => {
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

export const MLAssessmentCard = ({
  rule_based_health_label,
  ml_health_label,
  eco_label,
  environmental_impact
}: MLAssessmentCardProps) => {
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
            {ml_health_label !== undefined && (
              <div className="space-y-2">
                <p className="text-xs font-medium text-muted-foreground">AI Prediction</p>
                <Badge className={`${getHealthLabelColor(ml_health_label)} text-sm font-semibold px-3 py-1 w-full justify-center`}>
                  {healthLabelText[ml_health_label as keyof typeof healthLabelText] || "Unknown"}
                </Badge>
              </div>
            )}
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
        <div className="rounded-lg bg-blue-50 border border-blue-200 p-3">
          <p className="text-xs text-blue-800">
            💡 <span className="font-medium">ML model</span> trained on real scanned product data
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
