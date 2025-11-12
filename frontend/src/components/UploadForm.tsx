import React, { useState } from "react";
import { Upload, Hash, Loader2, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface UploadFormProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading: boolean;
}

export const UploadForm = ({ onBarcodeDetected, isLoading }: UploadFormProps) => {
  const [manualBarcode, setManualBarcode] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showScanner, setShowScanner] = useState(false);

  // Lazy-load CameraScanner to avoid SSR/window issues
  const CameraScanner = React.lazy(() => import("./CameraScanner"));

  // Handle image upload to detect barcode
  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("Please upload a valid image file");
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image size must be less than 5MB");
      return;
    }

    setUploadingImage(true);
    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch("/api/upload", {
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
      // Reset file input
      event.target.value = "";
    }
  };

  // Handle manual barcode submission
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!manualBarcode.trim()) {
      toast.error("Please enter a barcode");
      return;
    }

    // Basic barcode validation (alphanumeric, typically 8-13 digits)
    if (!/^\d{8,13}$/.test(manualBarcode.trim())) {
      toast.error("Please enter a valid barcode (8-13 digits)");
      return;
    }

    onBarcodeDetected(manualBarcode.trim());
  };

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Scan Product</CardTitle>
        <CardDescription>Upload a product image or enter the barcode manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Image Upload Section */}
        <div className="space-y-3">
          <Label htmlFor="image-upload" className="text-sm font-medium">
            Upload Product Image
          </Label>
          <div className="flex flex-col items-center justify-center gap-4">
              <div className="flex w-full justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowScanner(true)}
                  disabled={isLoading || uploadingImage}
                  className="mb-2"
                >
                  <Camera className="mr-2 h-4 w-4" />
                  Open Camera
                </Button>
              </div>
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

        {showScanner && (
          <div className="mt-4">
            {/* Lazy-load the camera scanner to avoid SSR problems */}
            <React.Suspense fallback={<div className="text-center">Opening camera...</div>}>
              {/* CameraScanner is dynamically imported to avoid bundling issues with window */}
              <CameraScanner
                onDetected={(code) => {
                  setShowScanner(false);
                  onBarcodeDetected(code);
                }}
                onClose={() => setShowScanner(false)}
              />
            </React.Suspense>
          </div>
        )}

        {/* Divider */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-border" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-card px-2 text-muted-foreground">Or</span>
          </div>
        </div>

        {/* Manual Barcode Entry */}
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
      </CardContent>
    </Card>
  );
};
