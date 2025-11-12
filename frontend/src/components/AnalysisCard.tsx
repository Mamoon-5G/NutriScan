import { FileText, RefreshCw, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface AnalysisCardProps {
  analysis: string;
  onReanalyze: () => void;
  isLoading: boolean;
}

export const AnalysisCard = ({ analysis, onReanalyze, isLoading }: AnalysisCardProps) => {
  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-xl">
          <FileText className="h-5 w-5 text-primary" />
          Analysis Summary
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={onReanalyze}
          disabled={isLoading}
          className="gap-2"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Analyzing...
            </>
          ) : (
            <>
              <RefreshCw className="h-4 w-4" />
              Re-analyze
            </>
          )}
        </Button>
      </CardHeader>
      <CardContent>
        <div className="rounded-lg bg-muted/50 p-4">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground">
            {analysis}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};
