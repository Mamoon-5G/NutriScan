import { useState, useRef } from "react";
import { Upload, Hash, Loader2, Camera as CameraIcon } from "lucide-react";
import axios from "axios";
import { FiCamera } from "react-icons/fi";
import { AiOutlineRobot } from "react-icons/ai";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { BrowserMultiFormatReader } from "@zxing/browser";
import { GeminiCameraModal } from "@/components/GeminiCameraModal";

interface UploadFormProps {
  onBarcodeDetected: (barcode: string) => void;
  isLoading: boolean;
  onOpenCamera: () => void;
}

export const UploadForm = ({ onBarcodeDetected, isLoading, onOpenCamera }: UploadFormProps) => {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const [manualBarcode, setManualBarcode] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);
  const [geminiModalOpen, setGeminiModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
      console.log("Barcode detected on client:", barcode);
      toast.success("Barcode detected successfully!");
      onBarcodeDetected(barcode);
      setUploadingImage(false);
      event.target.value = "";
      return;
    } catch (zxingError) {
      console.warn("Client-side barcode detection failed:", zxingError);
      // If no barcode found, fall back to server
    }

    // Fallback to server-side processing
    const formData = new FormData();
    formData.append("image", file);

    try {
      const { data } = await axios.post(`${apiBaseUrl}/api/upload`, formData);

      if (data.barcode) {
        toast.success("Barcode detected successfully!");
        onBarcodeDetected(data.barcode);
        setManualBarcode("");
      } else {
        toast.error("No barcode detected in the image. Please try again or enter manually.");
      }
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to process image. Please try manual entry.");
    } finally {
      setUploadingImage(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
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

  // Clear barcode input when loading state changes
  const handleClearBarcode = () => {
    setManualBarcode("");
  };

  return (
    <>
      <Card className="shadow-premium border-border/50 glass overflow-hidden rounded-[2.5rem] animate-in fade-in slide-in-from-top-4 duration-700">
        <CardHeader className="text-center pt-8 pb-2">
          <CardTitle className="text-3xl font-black font-display tracking-tight text-foreground">Scan Product</CardTitle>
          <CardDescription className="text-muted-foreground text-md max-w-xs mx-auto">
            Upload a product image or enter the barcode manually
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2">
              <Button
                type="button"
                onClick={onOpenCamera}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-3 h-28 w-full rounded-3xl border-2 border-primary/20 bg-primary/5 text-primary shadow-soft font-bold hover:bg-primary/10 transition-all group"
              >
                <div className="p-3 rounded-2xl bg-primary text-white group-hover:scale-110 transition-transform">
                  <FiCamera className="h-6 w-6" />
                </div>
                <span className="text-sm">Live Scan</span>
              </Button>
              <Button
                type="button"
                onClick={() => setGeminiModalOpen(true)}
                disabled={isLoading}
                className="flex flex-col items-center justify-center gap-3 h-28 w-full rounded-3xl border-2 border-purple-500/20 bg-purple-500/5 text-purple-600 shadow-soft font-bold hover:bg-purple-500/10 transition-all group"
              >
                <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 text-white group-hover:scale-110 transition-transform">
                  <AiOutlineRobot className="h-6 w-6" />
                </div>
                <span className="text-sm">AI Food Scan</span>
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex flex-col items-center justify-center gap-4">
              <label
                htmlFor="image-upload"
                className={`flex w-full cursor-pointer flex-col items-center justify-center rounded-[2rem] border-2 border-dashed px-6 py-10 transition-all ${
                  uploadingImage
                    ? "border-primary bg-primary/5"
                    : "border-border bg-white/30 dark:bg-black/20 hover:border-primary hover:bg-white/50 dark:hover:bg-black/40"
                }`}
              >
                {uploadingImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <div className="relative h-12 w-12">
                      <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    </div>
                    <span className="text-sm font-bold tracking-tight text-foreground">Analyzing Image...</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 rounded-full bg-muted/50 text-muted-foreground">
                      <Upload className="h-8 w-8" />
                    </div>
                    <div className="text-center">
                      <span className="block text-sm font-bold text-foreground mb-1">
                        Upload Product Photo
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">PNG or JPG up to 5MB</span>
                    </div>
                  </div>
                )}
                <Input
                  ref={fileInputRef}
                  id="image-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  disabled={isLoading || uploadingImage}
                  className="hidden"
                />
              </label>
            </div>
          </div>

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
          <form onSubmit={handleManualSubmit} className="space-y-4 animate-in fade-in duration-500">
            <div className="space-y-2">
              <Label htmlFor="manual-barcode" className="text-sm font-medium">
                Enter Barcode Manually
              </Label>
              <div className="flex gap-2 flex-col sm:flex-row">
                <div className="relative flex-1">
                  <Hash className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="manual-barcode"
                    type="text"
                    placeholder="e.g., 3017620422003"
                    value={manualBarcode}
                    onChange={(e) => setManualBarcode(e.target.value.replace(/\D/g, ""))}
                    disabled={isLoading || uploadingImage}
                    className="pl-9 w-full"
                    maxLength={13}
                    aria-label="Enter barcode manually"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isLoading || uploadingImage || !manualBarcode.trim()}
                  className="gradient-primary shadow-soft whitespace-nowrap min-w-[100px]"
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
            <p className="text-xs text-muted-foreground">
              Enter 8-13 digit barcode (UPC, EAN, or ISBN)
            </p>
          </form>
        </CardContent>
      </Card>

      {/* AI Camera Modal */}
      <GeminiCameraModal
        open={geminiModalOpen}
        onClose={() => {
          setGeminiModalOpen(false);
          handleClearBarcode();
        }}
      />
    </>
  );
};
