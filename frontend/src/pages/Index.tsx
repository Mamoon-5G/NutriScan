import { useState } from "react";
import { Leaf, Loader2 } from "lucide-react";
import { UploadForm } from "@/components/UploadForm";
import { ProductCard } from "@/components/ProductCard";
import { AnalysisCard } from "@/components/AnalysisCard";
import { EnvironmentalImpact } from "@/components/EnvironmentalImpact";
import { HealthRiskDialog } from "@/components/HealthRiskDialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";

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
  environmental_impact?: {
    material: string;
    co2: number;
    water: number;
    waste: number;
  } | null;
  health_risk?: 'Safe' | 'Moderate' | 'Harmful';
  health_score?: number;
}

const Index = () => {
  const [productData, setProductData] = useState<ProductData | null>(null);
  const [analysisData, setAnalysisData] = useState<string>("");
  const [isLoadingProduct, setIsLoadingProduct] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);
  const [showHealthRisk, setShowHealthRisk] = useState(false);

  // Fetch product details from API
  const fetchProductDetails = async (barcode: string) => {
    setIsLoadingProduct(true);
    
    try {
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/product/${barcode}`);
      
      if (!response.ok) {
        throw new Error("Product not found");
      }

      const data = await response.json();
      setProductData(data);
      
      // Automatically trigger analysis after fetching product
      await analyzeProduct(data);
      
      // Show health risk dialog
      if (data.health_risk) {
        setShowHealthRisk(true);
      } else {
        toast.success("Product loaded successfully!");
      }
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
      const apiUrl = import.meta.env.VITE_API_URL || "";
      const response = await fetch(`${apiUrl}/api/product/analyze`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product }),
      });

      if (!response.ok) {
        throw new Error("Analysis failed");
      }

      const data = await response.json();
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
    <>
      <HealthRiskDialog
        isOpen={showHealthRisk}
        onClose={() => setShowHealthRisk(false)}
        healthRisk={productData?.health_risk}
        productName={productData?.product_name}
      />
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
                {analysisData && (
                  <AnalysisCard
                    analysis={analysisData}
                    onReanalyze={handleReanalyze}
                    isLoading={isLoadingAnalysis}
                  />
                )}
                <EnvironmentalImpact impact={productData.environmental_impact || null} />
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
    </div>
    </>
  );
};

export default Index;
