import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, X, Sparkles, Database, ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";

interface MissingProductVisionCardProps {
  barcode: string;
  onDataGenerated: (data: any) => void;
  onCancel: () => void;
}

export const MissingProductVisionCard = ({
  barcode,
  onDataGenerated,
  onCancel
}: MissingProductVisionCardProps) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [photoStep, setPhotoStep] = useState<"ingredients" | "nutrition" | "done">("ingredients");
  const [images, setImages] = useState<{ ingredients?: string; nutrition?: string }>({});
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsCameraActive(true);
    } catch {
      toast.error("Could not access camera. Please allow permissions.");
    }
  };

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  }, []);

  // Hardware cleanup to prevent the green camera light staying on if the modal unmounts
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const capturePhoto = () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);

    if (photoStep === "ingredients") {
      setImages(prev => ({ ...prev, ingredients: dataUrl }));
      setPhotoStep("nutrition");
    } else {
      setImages(prev => ({ ...prev, nutrition: dataUrl }));
      setPhotoStep("done");
      stopCamera();
    }
  };

  // Turn base64 into a Blob to send to the backend
  const dataUrlToBlob = (dataUrl: string): Blob => {
    const [meta, base64] = dataUrl.split(",");
    const mimeMatch = meta?.match(/data:(.*);base64/);
    const mime = mimeMatch?.[1] || "image/jpeg";
    const binary = atob(base64 || "");
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new Blob([bytes], { type: mime });
  };

  const analyzeWithVision = async () => {
    if (!images.ingredients || !images.nutrition) return;
    
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
    setIsAnalyzing(true);
    
    try {
      // Create FormData to send multi-part images
      const formData = new FormData();
      formData.append("barcode", barcode);
      formData.append("ingredients_image", dataUrlToBlob(images.ingredients), "ing.jpg");
      formData.append("nutrition_image", dataUrlToBlob(images.nutrition), "nut.jpg");

      // We'll tell the backend to use Gemini Vision to build the ProductData
      const response = await axios.post(`${apiBaseUrl}/api/analyze-vision`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("AI extraction complete!");
      onDataGenerated(response.data.productData); // Inject directly into frontend state pipeline
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Vision analysis failed. Please try again.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Primary Action Button UI based on state
  return (
    <Card className="relative overflow-hidden border-border/50 shadow-medium">
      <div className="absolute top-0 right-0 p-4">
         <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:bg-muted">
           <X size={20} />
         </Button>
      </div>

      <CardContent className="p-8">
        {!isCameraActive && photoStep === "ingredients" && (
          <div className="flex flex-col items-center text-center max-w-md mx-auto space-y-6 pt-6">
            <div className="h-16 w-16 bg-primary/10 text-primary flex items-center justify-center rounded-2xl">
              <Database className="h-8 w-8" />
            </div>
            <div>
              <h2 className="text-2xl font-bold font-display tracking-tight text-foreground mb-2">
                 Not Found in Global Registry
              </h2>
              <p className="text-muted-foreground">
                 We couldn't find barcode <span className="font-mono text-foreground font-medium">{barcode}</span> in OpenFoodFacts. 
                 But our AI can extract the data directly from the packaging.
              </p>
            </div>
            
            <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-left w-full">
              <h4 className="flex items-center gap-2 font-semibold text-primary mb-2">
                 <Sparkles className="h-4 w-4" /> AI OCR Extraction
              </h4>
              <p className="text-sm text-foreground/80 mb-3">You will need to snap two clear photos:</p>
              <ul className="text-sm space-y-2 text-foreground/70">
                 <li className="flex gap-2"><span>1.</span> 📸 The Ingredients List</li>
                 <li className="flex gap-2"><span>2.</span> 📸 The Nutrition Facts Label</li>
              </ul>
            </div>

            <Button onClick={startCamera} size="lg" className="w-full h-12 text-md gap-2 rounded-xl">
               <Camera className="w-5 h-5" /> Start Scanning Label
            </Button>
          </div>
        )}

        {isCameraActive && (
          <div className="flex flex-col items-center space-y-4">
             <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-2xl overflow-hidden border shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="absolute inset-0 w-full h-full object-cover"
                />
                
                {/* Viewfinder Overlay */}
                <div className="absolute inset-0 border-[6px] border-black/30 m-6 rounded-xl border-dashed"></div>
                
                <div className="absolute top-4 left-0 right-0 text-center">
                  <span className="bg-black/60 text-white px-4 py-1.5 rounded-full text-sm font-medium backdrop-blur-sm shadow-md">
                     Capture: {photoStep === "ingredients" ? "Ingredients List" : "Nutrition Facts"}
                  </span>
                </div>
                
                <canvas ref={canvasRef} className="hidden" />
             </div>
             
             <div className="flex gap-4 w-full max-w-sm pt-2">
                <Button variant="outline" size="lg" className="flex-1" onClick={stopCamera}>
                   Cancel
                </Button>
                <Button size="lg" className="flex-1 gap-2" onClick={capturePhoto}>
                   <Camera className="w-5 h-5" /> Snap
                </Button>
             </div>
          </div>
        )}

        {photoStep === "done" && !isAnalyzing && (
          <div className="flex flex-col items-center text-center space-y-6 pt-4">
             <h3 className="text-xl font-semibold font-display">Photos Captured!</h3>
             <div className="grid grid-cols-2 gap-4">
                <img src={images.ingredients} alt="Ingredients" className="w-32 h-32 object-cover rounded-xl border" />
                <img src={images.nutrition} alt="Nutrition" className="w-32 h-32 object-cover rounded-xl border" />
             </div>
             
             <div className="flex w-full gap-4 pt-4 text-sm font-medium">
               <Button variant="outline" className="flex-1 h-12" onClick={() => { setPhotoStep("ingredients"); startCamera(); }}>
                 <RefreshCw className="w-4 h-4 mr-2" /> Retake
               </Button>
               <Button className="flex-1 h-12" onClick={analyzeWithVision}>
                 <Sparkles className="w-4 h-4 mr-2" /> Extract Data
               </Button>
             </div>
          </div>
        )}

        {isAnalyzing && (
          <div className="flex flex-col items-center justify-center py-12 space-y-8">
             <div className="relative h-20 w-20 flex items-center justify-center">
               <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin"></div>
               <Sparkles className="h-8 w-8 text-primary animate-pulse" />
             </div>
             <div className="text-center space-y-2">
                <h3 className="text-lg font-semibold font-display">Gemini Vision Active</h3>
                <p className="text-muted-foreground text-sm">Extracting macronutrients and parsing ingredients via LLM...</p>
             </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
