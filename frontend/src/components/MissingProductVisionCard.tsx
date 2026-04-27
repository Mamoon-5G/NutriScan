import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, X, Sparkles, Database } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

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
      const response = await axios.post(`${apiBaseUrl}/api/analyze-food/vision`, formData, {
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
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <Card className="relative overflow-hidden border-border/50 shadow-premium glass">
        <div className="absolute top-0 right-0 p-4 z-10">
           <Button variant="ghost" size="icon" onClick={onCancel} className="text-muted-foreground hover:bg-muted/50 rounded-full">
             <X size={20} />
           </Button>
        </div>

        <CardContent className="p-8">
          <AnimatePresence mode="wait">
            {!isCameraActive && photoStep === "ingredients" && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center text-center max-w-md mx-auto space-y-6 pt-6"
              >
                <div className="h-20 w-20 bg-primary/10 text-primary flex items-center justify-center rounded-3xl shadow-inner">
                  <Database className="h-10 w-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-3">
                     Product Not Found
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                     Barcode <span className="font-mono text-foreground font-semibold px-1.5 py-0.5 bg-muted rounded-md">{barcode}</span> is missing from our registry. 
                     Our AI can extract the data directly from your photos.
                  </p>
                </div>
                
                <div className="bg-primary/5 border border-primary/20 rounded-2xl p-5 text-left w-full shadow-sm">
                  <h4 className="flex items-center gap-2 font-bold text-primary mb-3">
                     <Sparkles className="h-5 w-5 animate-pulse" /> AI Vision Extraction
                  </h4>
                  <div className="space-y-3">
                    <p className="text-sm font-medium text-foreground/80">Follow these steps for best results:</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-primary/10 text-center space-y-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Step 1</div>
                        <div className="text-sm font-medium">Ingredients List</div>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 p-3 rounded-xl border border-primary/10 text-center space-y-2">
                        <div className="text-xs uppercase tracking-wider text-muted-foreground font-bold">Step 2</div>
                        <div className="text-sm font-medium">Nutrition Facts</div>
                      </div>
                    </div>
                  </div>
                </div>

                <Button onClick={startCamera} size="lg" className="w-full h-14 text-md gap-3 rounded-2xl shadow-lg gradient-primary hover:shadow-xl transition-all">
                   <Camera className="w-6 h-6" /> Start AI Label Scan
                </Button>
              </motion.div>
            )}

            {isCameraActive && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center space-y-6"
              >
                 <div className="relative w-full max-w-sm aspect-[3/4] bg-black rounded-3xl overflow-hidden border-4 border-muted shadow-2xl">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover opacity-80"
                    />
                    
                    {/* Scifi Viewfinder Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                      {/* Corners */}
                      <div className="absolute top-8 left-8 w-8 h-8 border-t-2 border-l-2 border-primary rounded-tl-lg"></div>
                      <div className="absolute top-8 right-8 w-8 h-8 border-t-2 border-r-2 border-primary rounded-tr-lg"></div>
                      <div className="absolute bottom-8 left-8 w-8 h-8 border-b-2 border-l-2 border-primary rounded-bl-lg"></div>
                      <div className="absolute bottom-8 right-8 w-8 h-8 border-b-2 border-r-2 border-primary rounded-br-lg"></div>
                      
                      {/* Scanning Line */}
                      <motion.div 
                        animate={{ top: ["10%", "90%", "10%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-6 right-6 h-[2px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_15px_hsl(var(--primary))]"
                      />
                      
                      {/* Grid overlay */}
                      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                    </div>
                    
                    <div className="absolute top-6 left-0 right-0 text-center">
                      <span className="bg-black/70 text-white px-5 py-2 rounded-full text-xs font-bold tracking-widest uppercase backdrop-blur-md border border-white/10 shadow-xl">
                         Capture: {photoStep === "ingredients" ? "Ingredients" : "Nutrition"}
                      </span>
                    </div>
                    
                    <canvas ref={canvasRef} className="hidden" />
                 </div>
                 
                 <div className="flex gap-4 w-full max-w-sm">
                    <Button variant="outline" size="lg" className="flex-1 h-14 rounded-2xl border-2" onClick={stopCamera}>
                       Cancel
                    </Button>
                    <Button size="lg" className="flex-1 h-14 gap-3 rounded-2xl shadow-lg gradient-primary" onClick={capturePhoto}>
                       <Camera className="w-6 h-6" /> Capture
                    </Button>
                 </div>
              </motion.div>
            )}

            {photoStep === "done" && !isAnalyzing && (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-8 pt-4"
              >
                 <div className="space-y-2">
                   <h3 className="text-2xl font-bold font-display">Ready to Analyze</h3>
                   <p className="text-muted-foreground text-sm">Review your captures before processing</p>
                 </div>

                 <div className="grid grid-cols-2 gap-6 w-full max-w-md">
                    <div className="space-y-2">
                      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md group">
                        <img src={images.ingredients} alt="Ingredients" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 font-bold">INGREDIENTS</div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="relative aspect-square rounded-2xl overflow-hidden border-2 border-primary/20 shadow-md group">
                        <img src={images.nutrition} alt="Nutrition" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" />
                        <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[10px] py-1 font-bold">NUTRITION</div>
                      </div>
                    </div>
                 </div>
                 
                 <div className="flex w-full gap-4 pt-4">
                   <Button variant="outline" className="flex-1 h-14 rounded-2xl border-2" onClick={() => { setPhotoStep("ingredients"); startCamera(); }}>
                     <RefreshCw className="w-5 h-5 mr-2" /> Retake
                   </Button>
                   <Button className="flex-1 h-14 rounded-2xl shadow-lg gradient-primary" onClick={analyzeWithVision}>
                     <Sparkles className="w-5 h-5 mr-2" /> Extract with AI
                   </Button>
                 </div>
              </motion.div>
            )}

            {isAnalyzing && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-16 space-y-10"
              >
                 <div className="relative h-32 w-32 flex items-center justify-center">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/40"
                   />
                   <div className="absolute inset-2 rounded-full border-[3px] border-primary/20 border-t-primary animate-spin"></div>
                   <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center">
                    <Sparkles className="h-10 w-10 text-primary animate-pulse" />
                   </div>
                 </div>
                 <div className="text-center space-y-3">
                    <h3 className="text-2xl font-bold font-display tracking-tight">Gemini Vision Processing</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto">
                      Our neural engine is currently reading the labels and calculating nutritional scores...
                    </p>
                 </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>
    </motion.div>
  );
};
