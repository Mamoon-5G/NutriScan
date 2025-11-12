import { Droplets, Leaf, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface EnvironmentalImpactProps {
  impact: {
    material: string;
    co2: number;
    water: number;
    waste: number;
  } | null;
}

export const EnvironmentalImpact = ({ impact }: EnvironmentalImpactProps) => {
  if (!impact) {
    return null;
  }

  // Normalize values to 0-100 range for progress bars
  // These are example thresholds - adjust based on your data
  const co2Score = Math.min((impact.co2 / 10) * 100, 100);
  const waterScore = Math.min((impact.water / 1000) * 100, 100);
  const wasteScore = Math.min((impact.waste / 5) * 100, 100);

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <Leaf className="h-5 w-5 text-green-500" />
          Environmental Impact
        </CardTitle>
        <CardDescription>
          Based on {impact.material} materials data from Agribalyse
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Leaf className="h-4 w-4 text-yellow-500" />
              <span className="text-sm font-medium">CO2 Emissions</span>
            </div>
            <span className="text-xs text-muted-foreground">{impact.co2.toFixed(2)} kg CO2 eq.</span>
          </div>
          <Progress value={co2Score} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Droplets className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">Water Usage</span>
            </div>
            <span className="text-xs text-muted-foreground">{impact.water.toFixed(2)} L</span>
          </div>
          <Progress value={waterScore} className="h-2" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trash2 className="h-4 w-4 text-red-500" />
              <span className="text-sm font-medium">Waste Generation</span>
            </div>
            <span className="text-xs text-muted-foreground">{impact.waste.toFixed(2)} kg</span>
          </div>
          <Progress value={wasteScore} className="h-2" />
        </div>
      </CardContent>
    </Card>
  );
};