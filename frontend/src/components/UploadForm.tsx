import { useState } from "react";
import { Upload, Hash, Search, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";

interface SearchResult {
  barcode: string;
  product_name: string;
  brands: string;
  image_url: string;
  nutrition_grade: string;
  ecoscore_grade: string;
}

interface UploadFormProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading: boolean;
  onOpenCamera: () => void;
}

export const UploadForm = ({ onBarcodeDetected, isLoading, onOpenCamera }: UploadFormProps) => {
  const [manualBarcode, setManualBarcode] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);

    try {
      // Try to detect barcode on client side first
      const reader = new BrowserMultiFormatReader();
      const img = new Image();
      img.src = URL.createObjectURL(file);
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });
      const result = reader.decodeFromImageElement(img);
      const barcode = (await result).getText();
      console.log("✅ Barcode detected on client:", barcode);
      toast.success("Barcode detected successfully!");
      onBarcodeDetected(barcode);
      setUploadingImage(false);
      event.target.value = "";
      return;
    } catch (zxingError) {
      console.warn("⚠️ Client-side barcode detection failed:", zxingError);
      // If no barcode found, fall back to server
    }

    // Fallback to server-side processing
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/upload`,
        {
          method: "POST",
          body: formData,
        });

      if (!response.ok) {
        throw new Error("Failed to detect barcode from image");
      }

      const data = await response.json();

      if (data.barcode) {
        toast.success("Barcode detected successfully!");
        onBarcodeDetected(data.barcode);
        setManualBarcode("");
      } else {
        toast.error("No barcode detected in the image. Please try again or enter manually.");
      }
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to process image. Please try manual entry.");
    } finally {
      setUploadingImage(false);
      event.target.value = "";
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!manualBarcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    if (!/^\d{8,13}$/.test(manualBarcode.trim())) {
      toast.error("Please enter a valid barcode (8-13 digits)");
      return;
    }

    onBarcodeDetected(manualBarcode.trim());
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim()) {
      toast.error("Please enter a product name");
      return;
    }

    setIsSearching(true);
    setShowSearchResults(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/product/search/${encodeURIComponent(searchQuery.trim())}`
      );

      if (!response.ok) {
        throw new Error("Search failed");
      }

      const data = await response.json();
      setSearchResults(data.products || []);

      if (data.products && data.products.length > 0) {
        toast.success(`Found ${data.products.length} product(s)!`);
      } else {
        toast.error("No products found");
      }
    } catch (error) {
      console.error("Error searching products:", error);
      toast.error("Failed to search products. Please try again.");
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectResult = (barcode: string) => {
    if (barcode) {
      onBarcodeDetected(barcode);
      setSearchQuery("");
      setSearchResults([]);
      setShowSearchResults(false);
    } else {
      toast.error("This product doesn't have a valid barcode");
    }
  };

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Scan Product</CardTitle>
        <CardDescription>Upload a product image or enter the barcode manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label htmlFor="image-upload" className="text-sm font-medium">
              Upload Product Image
            </Label>

            <Button
              type="button"
              onClick={onOpenCamera}
              className="flex items-center gap-2 text-sm px-4 py-2 gradient-primary shadow-soft font-semibold"
            >
              📷 Open Camera
            </Button>
          </div>


          <div className="flex flex-col items-center justify-center gap-4">
            <label
              htmlFor="image-upload"
              className="flex w-full cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/30 px-6 py-8 transition-all hover:border-primary hover:bg-muted/50"
            >
              {uploadingImage ? (
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
              ) : (
                <Upload className="h-10 w-10 text-muted-foreground" />
              )}
              <span className="mt-2 text-sm font-medium text-foreground">
                {uploadingImage ? "Processing image..." : "Click to upload or drag and drop"}
              </span>
              <span className="mt-1 text-xs text-muted-foreground">PNG, JPG up to 5MB</span>
            </label>
            <Input
              id="image-upload"
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={isLoading || uploadingImage}
              className="hidden"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <form onSubmit={handleManualSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="manual-barcode" className="text-sm font-medium">
              Enter Barcode Manually
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="manual-barcode"
                  type="text"
                  placeholder="e.g., 3017620422003"
                  value={manualBarcode}
                  onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
                  disabled={isLoading || uploadingImage}
                  className="pl-9"
                  maxLength={13}
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || uploadingImage || !manualBarcode.trim()}
                className="gradient-primary shadow-soft"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  "Scan"
                )}
              </Button>
            </div>
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search-product" className="text-sm font-medium">
              Search by Product Name
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="search-product"
                  type="text"
                  placeholder="e.g., Coca Cola, Apple Juice"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  disabled={isLoading || uploadingImage || isSearching}
                  className="pl-9"
                />
              </div>
              <Button
                type="submit"
                disabled={isLoading || uploadingImage || isSearching || !searchQuery.trim()}
                variant="outline"
                className="shadow-soft"
              >
                {isSearching ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Searching...
                  </>
                ) : (
                  "Search"
                )}
              </Button>
            </div>
          </div>

          {/* Search Results */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="mt-4 space-y-2 border-t pt-4">
              <Label className="text-sm font-medium">Search Results</Label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {searchResults.map((result, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between gap-3 rounded-lg border border-border bg-muted/30 p-3 hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{result.product_name}</p>
                      <p className="text-xs text-muted-foreground truncate">{result.brands}</p>
                      <div className="flex gap-2 mt-1">
                        {result.nutrition_grade !== "unknown" && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-blue-100 text-blue-800">
                            NutriScore: {result.nutrition_grade.toUpperCase()}
                          </span>
                        )}
                        {result.ecoscore_grade !== "unknown" && (
                          <span className="inline-block px-2 py-0.5 text-xs rounded bg-green-100 text-green-800">
                            EcoScore: {result.ecoscore_grade.toUpperCase()}
                          </span>
                        )}
                      </div>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => handleSelectResult(result.barcode)}
                      disabled={isLoading || uploadingImage}
                      className="gradient-primary shadow-soft whitespace-nowrap"
                    >
                      Select
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => {
                  setShowSearchResults(false);
                  setSearchResults([]);
                }}
                className="w-full text-muted-foreground"
              >
                <X className="h-4 w-4 mr-1" />
                Clear Results
              </Button>
            </div>
          )}
        </form>
      </CardContent>
    </Card>
  );
};
