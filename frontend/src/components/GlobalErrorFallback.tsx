import type { FallbackProps } from "react-error-boundary";
import { AlertCircle, RotateCcw } from "lucide-react";

export const GlobalErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center animate-in fade-in zoom-in duration-500">
        <div className="mx-auto h-24 w-24 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground">Something went wrong</h1>
          <p className="text-muted-foreground">
            We apologize, but an unexpected error occurred while rendering this page.
          </p>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 text-left overflow-auto max-h-48 border border-border">
          <pre className="text-xs text-destructive font-mono whitespace-pre-wrap break-words">
            {error instanceof Error ? error.message : String(error)}
          </pre>
        </div>

        <button
          onClick={resetErrorBoundary}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:bg-primary/90 transition-colors shadow-soft"
        >
          <RotateCcw className="h-5 w-5" />
          Try Again
        </button>
      </div>
    </div>
  );
};
