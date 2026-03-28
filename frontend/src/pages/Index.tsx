import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
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
  const [showCamera, setShowCamera] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);


  // Fetch product details from API
  const fetchProductDetails = async (barcode: string) => {
    setIsLoadingProduct(true);

    try {
      const { data } = await axios.get(`${apiBaseUrl}/api/product/${barcode}`);
      setProductData(data);
      await analyzeProduct(data);

      toast.success("Product loaded successfully!");
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Failed to load product details. Please check the barcode and try again.");
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
    } catch (error) {
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

  return (
    <div className="min-h-screen py-8 px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3">
            <div className="rounded-full bg-primary p-3 shadow-soft">
              <Leaf className="h-8 w-8 text-primary-foreground" />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              NutriScan
            </h1>
          </div>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Discover the environmental and nutritional impact of your products.
            Scan barcodes to get detailed insights and make informed choices.
          </p>
        </div>

        {/* Upload Form */}

        <UploadForm
          onBarcodeDetected={fetchProductDetails}
          isLoading={isLoadingProduct || isLoadingAnalysis}
          onOpenCamera={() => setShowCamera(true)}
        />


        {/* Results Section */}
        {(productData || isLoadingProduct) && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {isLoadingProduct ? (
              <Card className="shadow-medium border-border/50">
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

        {/* Empty State */}
        {!productData && !isLoadingProduct && (
          <div className="text-center py-12 space-y-4">
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