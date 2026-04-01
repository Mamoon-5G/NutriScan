import { useState, useEffect } from "react";
import { Leaf, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import axios from "axios";
import { UploadForm } from "@/components/UploadForm";
import { ProductCard } from "@/components/ProductCard";
import { AnalysisCard } from "@/components/AnalysisCard";
import { MLAssessmentCard } from "@/components/MLAssessmentCard";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import LiveScanner from "@/components/LiveScanner";

interface UnifiedScore {
  overall_eco_score: 'High' | 'Moderate' | 'Low';
  health_score: 'High' | 'Moderate' | 'Low';
  confidence: number;
}

interface ProductData {
  product_name?: string;
  brands?: string;
  image_url?: string;
  nutrition_grade?: string;
  ecoscore_grade?: string;
  ingredients_text?: string;
  harmful_ingredients?: string[];
  allergens?: string;
  nova_group?: number;
  rule_based_health_label?: number;
  ml_health_label?: number | string;
  environmental_impact?: string;
  labels?: {
    health_label?: number;
    eco_label?: number;
  };
  ml_features?: Record<string, number>;
  unified_score?: UnifiedScore;
}

const Index = () => {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [analysisData, setAnalysisData] = useState<string>("");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Clear error when product changes
  useEffect(() => {
    if (productData) {
      setError(null);
    }
  }, [productData]);

  // Fetch product details from API
  const fetchProductDetails = async (barcode: string) => {
    setIsLoadingProduct(true);
    setError(null);

    try {
      const { data } = await axios.get(`${apiBaseUrl}/api/product/${barcode}`);
      setProductData(data);
      await analyzeProduct(data);

      toast.success("Product loaded successfully!");
    } catch (error: any) {
      console.error("Error fetching product:", error);
      const errorMessage = error.response?.data?.error || "Failed to load product details. Please check the barcode and try again.";
      toast.error(errorMessage);
      setError(errorMessage);
      setProductData(null);
      setAnalysisData("");
    } finally {
      setIsLoadingProduct(false);
    }
  };

  // Analyze product using API
  const analyzeProduct = async (product: ProductData) => {
    setIsLoadingAnalysis(true);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/product/analyze`, { product });
      setAnalysisData(data.analysis || data.summary || "Analysis completed successfully.");
      toast.success("Analysis completed!");
    } catch (error: any) {
      console.error("Error analyzing product:", error);
      toast.error("Failed to analyze product. Please try again.");
      setAnalysisData("Analysis unavailable at the moment.");
    } finally {
      setIsLoadingAnalysis(false);
    }
  };

  // Handle re-analyze button
  const handleReanalyze = () => {
    if (productData) {
      analyzeProduct(productData);
    }
  };

  // Reset current view
  const handleReset = () => {
    setProductData(null);
    setAnalysisData("");
    setError(null);
  };

  return (
    <div className="min-h-screen py-6 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl space-y-6 sm:space-y-8">
        {/* Header */}
        <div className="text-center space-y-3 sm:space-y-4 animate-in fade-in duration-500">
          <div className="flex items-center justify-center gap-2 sm:gap-3">
            <div className="rounded-full bg-primary p-2 sm:p-3 shadow-soft">
              <Leaf className="h-6 w-6 sm:h-8 sm:w-8 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-4xl font-bold tracking-tight text-foreground">
              NutriScan
            </h1>
          </div>
          <p className="text-sm sm:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
            Discover the environmental and nutritional impact of your products.
            Scan barcodes to get detailed insights and make informed choices.
          </p>
        </div>

        {/* Upload Form */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
          <UploadForm
            onBarcodeDetected={fetchProductDetails}
            isLoading={isLoadingProduct || isLoadingAnalysis}
            onOpenCamera={() => setShowCamera(true)}
          />
        </div>

        {/* Results Section */}
        {(productData || isLoadingProduct) && (
          <div className="space-y-4 sm:space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoadingProduct ? (
              <Card className="shadow-medium border-border/50 animate-pulse">
                <CardContent className="flex items-center justify-center py-12">
                  <div className="text-center space-y-3">
                    <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto" />
                    <p className="text-muted-foreground">Loading product details...</p>
                  </div>
                </CardContent>
              </Card>
            ) : productData ? (
              <>
                <ProductCard product={productData} />
                <MLAssessmentCard
                  unified_score={productData.unified_score}
                  rule_based_health_label={productData.rule_based_health_label}
                  ml_health_label={productData.ml_health_label}
                  eco_label={productData.labels?.eco_label}
                  environmental_impact={productData.environmental_impact}
                  isLoading={isLoadingAnalysis}
                  error={error}
                />
                {analysisData && (
                  <AnalysisCard
                    analysis={analysisData}
                    onReanalyze={handleReanalyze}
                    isLoading={isLoadingAnalysis}
                  />
                )}
              </>
            ) : null}
          </div>
        )}

        {/* Error State */}
        {error && !productData && !isLoadingProduct && (
          <div className="text-center py-8 animate-in fade-in">
            <div className="mx-auto h-16 w-16 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
            <h3 className="text-xl font-semibold text-foreground mt-4">Scan Failed</h3>
            <p className="text-destructive mt-2 max-w-md mx-auto">
              {error}
            </p>
            <button
              onClick={handleReset}
              className="mt-6 inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <CheckCircle className="h-4 w-4" />
              Try Another Product
            </button>
          </div>
        )}

        {/* Empty State */}
        {!productData && !isLoadingProduct && !error && (
          <div className="text-center py-12 space-y-4 animate-in fade-in duration-500">
            <div className="mx-auto h-24 w-24 rounded-full bg-muted/50 flex items-center justify-center">
              <Leaf className="h-12 w-12 text-muted-foreground" />
            </div>
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-foreground">Ready to Scan</h3>
              <p className="text-muted-foreground max-w-md mx-auto">
                Upload a product image or enter a barcode to get started with your eco-friendly product analysis.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Camera Scanner Modal */}
      {showCamera && (
        <LiveScanner
          onDetected={(barcode) => {
            fetchProductDetails(barcode);
          }}
          onClose={() => setShowCamera(false)}
        />
      )}
    </div>
  );
};

export default Index;
