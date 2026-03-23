import { useState } from "react";
import { Upload, Hash, Loader2 } from "lucide-react";
import { FiCamera } from "react-icons/fi";
import { AiOutlineRobot } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { LLMCameraModal } from "@/components/LLMCameraModal";

interface UploadFormProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading: boolean;
  onOpenCamera: () => void;
}

export const UploadForm = ({ onBarcodeDetected, isLoading, onOpenCamera }: UploadFormProps) => {
  const [manualBarcode, setManualBarcode] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [llmModalOpen, setLlmModalOpen] = useState(false);

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

  // Removed product name search logic

  return (
    <>
    <Card className="shadow-medium border-border/50">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold">Scan Product</CardTitle>
        <CardDescription>Upload a product image or enter the barcode manually</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 w-full">
            <Label htmlFor="image-upload" className="text-sm font-medium mb-2 sm:mb-0">
              Upload Product Image
            </Label>
            <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
              <Button
                type="button"
                onClick={onOpenCamera}
                className="flex-1 sm:flex-none flex items-center gap-2 text-sm px-4 py-2 gradient-primary shadow-soft font-semibold w-full sm:w-auto"
              >
                 <FiCamera className="h-4 w-4" />
                 <span>Scan Barcode</span>
              </Button>
              <Button
                type="button"
                onClick={() => setLlmModalOpen(true)}
                className="flex-1 sm:flex-none flex items-center gap-2 text-sm px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-soft font-semibold hover:from-purple-600 hover:to-pink-600 w-full sm:w-auto"
              >
                 <AiOutlineRobot className="h-4 w-4" />
                 <span>AI Food Scan</span>
              </Button>
            </div>
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
          </div>
        </div>

        {/* Removed product name search UI */}
      </CardContent>
    </Card>

    <LLMCameraModal
      open={llmModalOpen}
      onClose={() => setLlmModalOpen(false)}
    />
    </>
  );
};
