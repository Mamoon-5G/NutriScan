import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, RefreshCw, X, Sparkles, Database, ArrowLeft, CheckCircle2 } from "lucide-react";
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

type FlowStep = "intro" | "camera" | "preview" | "analyzing";
type CaptureStep = "front" | "ingredients";

export const MissingProductVisionCard = ({
  barcode,
  onDataGenerated,
  onCancel
}: MissingProductVisionCardProps) => {
  const [step, setStep] = useState<FlowStep>("intro");
  const [captureStep, setCaptureStep] = useState<CaptureStep>("front");
  const [images, setImages] = useState<{ front: string | null; ingredients: string | null }>({
    front: null,
    ingredients: null,
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mountedRef = useRef(true);

  const startCamera = useCallback(async () => {
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      setStep("camera");

      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: { 
            facingMode: "environment", 
            width: { ideal: 1920 }, 
            height: { ideal: 1080 },
            aspectRatio: { ideal: 1 } 
          },
        });
      } catch {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
      }

      if (!mountedRef.current) {
        stream.getTracks().forEach((t) => t.stop());
        return;
      }

      streamRef.current = stream;
      
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.onloadedmetadata = () => {
            if (mountedRef.current && videoRef.current) {
              videoRef.current.play().catch((e) => console.error("Error playing video:", e));
            }
          };
        }
      }, 100);
    } catch (err) {
      console.error("Camera error:", err);
      toast.error("Could not access camera. Please allow permissions.");
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      stopCamera();
    };
  }, [stopCamera]);

const capturePhoto = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    if (!video. videoWidth || !video. videoHeight) {
      toast.error("Camera not ready. Please wait a moment and try again.");
      return;
    }

    canvas. width = video. videoWidth;
    canvas. height = video. videoHeight;
    const ctx = canvas. getContext("2d");
    if (!ctx) return;

    ctx. drawImage(video, 0, 0);
    const dataUrl = canvas. toDataURL("image/jpeg", 0.92);
    if (captureStep === "front") {
      setImages((prev) => ({ ...prev, front: dataUrl }));
      setCaptureStep("ingredients");
      toast. success("Front label captured. Now capture ingredients.");
      return;
    }

    setImages((prev) => ({ ...prev, ingredients: dataUrl }));
    stopCamera();
    setStep("preview");
  }, [captureStep, stopCamera]);

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
    if (!images.front || !images.ingredients) {
      toast.error("Please capture both photos before analyzing");
      return;
    }
    
    const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
    setIsAnalyzing(true);
    setStep("analyzing");
    
    try {
      const formData = new FormData();
      formData.append("barcode", barcode);
      formData.append("product_front_image", dataUrlToBlob(images.front), "front.jpg");
      formData.append("ingredients_image", dataUrlToBlob(images.ingredients), "ingredients.jpg");

      const response = await axios.post(`${apiBaseUrl}/api/analyze-food/vision`, formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      
      toast.success("AI analysis complete!");
      onDataGenerated(response.data.productData);
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Analysis failed. Please try again.");
      setStep("preview");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const restartCapture = (target: CaptureStep) => {
    setCaptureStep(target);
    setStep("intro");
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="relative"
    >
      <Card className="relative overflow-hidden border-border/50 shadow-premium bg-background text-foreground">
        <div className="absolute top-0 right-0 p-4 z-20">
           <Button variant="ghost" size="icon" onClick={onCancel} className="text-primary hover:bg-primary/20 rounded-full bg-primary/10">
             <X size={20} />
           </Button>
        </div>

        <CardContent className="p-0">
          <AnimatePresence mode="wait">
            {step === "intro" && (
              <motion.div 
                key="intro"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex flex-col items-center text-center max-w-md mx-auto space-y-6 p-8 py-12"
              >
                <div className="h-20 w-20 bg-primary/10 text-primary flex items-center justify-center rounded-2xl shadow-inner relative">
                  <div className="absolute inset-0 bg-primary/20 rounded-2xl animate-pulse blur-xl" />
                  <Database className="h-10 w-10 relative z-10" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold font-display tracking-tight text-foreground mb-3">
                     Product Not Found
                  </h2>
                  <p className="text-muted-foreground leading-relaxed">
                    Barcode <span className="font-mono text-primary font-semibold px-1.5 py-0.5 bg-primary/10 rounded-md">{barcode}</span> was not found.
                  </p>
                </div>
                <div className="w-full rounded-xl border border-primary/20 bg-primary/5 p-5 text-left">
                  <p className="mb-2 text-sm font-semibold text-foreground">Take 2 photos:</p>
                  <p className="text-sm text-muted-foreground">1. Front label (product name/brand)</p>
                  <p className="text-sm text-muted-foreground">2. Ingredients list</p>
                </div>

                <div className="flex w-full gap-3">
                  <Button variant="outline" onClick={onCancel} className="flex-1 h-12 border-primary/20 text-primary hover:bg-primary/5">
                    Cancel
                  </Button>
                  <Button onClick={startCamera} className="flex-1 h-12 gradient-primary">
                    <Camera className="mr-2 h-5 w-5" /> Start Camera
                  </Button>
                </div>
              </motion.div>
            )}

            {step === "camera" && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center bg-black min-h-[500px]"
              >
                 <div className="relative w-full h-[calc(100vh-200px)] max-h-[600px] overflow-hidden">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      muted
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    
                    {/* Premium Scifi Viewfinder Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-10">
                      {/* Corners with thicker style */}
                      <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                      <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                      <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                      <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                      
                      {/* Animated Scanning Line */}
                      <motion.div 
                        animate={{ top: ["15%", "85%", "15%"] }}
                        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0:25px_hsl(var(--primary))]"
                      />
                      
                      {/* Grid overlay */}
                      <div className="absolute inset-0 opacity-20 bg-[linear-gradient(rgba(var(--primary),0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.1)_1px,transparent_1px)] bg-[size:30px_30px]"></div>
                      
                      <div className="absolute bottom-24 left-0 right-0 text-center">
                        <p className="text-white/80 text-xs font-bold tracking-[0.2em] uppercase bg-black/40 backdrop-blur-sm inline-block px-4 py-2 rounded-lg border border-white/10">
                          {captureStep === "front" ? "Capture Front Label" : "Capture Ingredients List"}
                        </p>
                      </div>
                    </div>
                    
                    <div className="absolute bottom-0 left-0 right-0 p-8 flex justify-center items-center gap-6 z-20 bg-gradient-to-t from-black/80 to-transparent">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-14 w-14 rounded-full border-2 border-white/20 bg-white/10 text-white hover:bg-white/20"
                        onClick={() => {
                          stopCamera();
                          setStep("intro");
                        }}
                      >
                        <ArrowLeft size={24} />
                      </Button>
                      
                      <button 
                        onClick={capturePhoto}
                        className="h-20 w-20 rounded-full border-4 border-white/40 p-1 group active:scale-95 transition-all"
                      >
                        <div className="h-full w-full rounded-full bg-white group-hover:bg-primary transition-colors flex items-center justify-center">
                          <Camera className="text-black group-hover:text-white" size={32} />
                        </div>
                      </button>
                      
                      <div className="w-14 h-14" /> {/* Spacer */}
                    </div>
                    
                      <canvas ref={canvasRef} className="hidden" />
                 </div>
              </motion.div>
            )}

            {step === "preview" && (
              <motion.div 
                key="preview"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center text-center space-y-8 p-8 py-12"
              >
                 <div className="space-y-2">
                   <h3 className="text-2xl font-bold font-display tracking-tight">Review Details</h3>
                   <p className="text-muted-foreground text-sm">Confirm both photos, then run AI extraction</p>
                 </div>

                 <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-3">
                      <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 bg-primary/5">
                        {images.front && <img src={images.front} alt="Front label" className="w-full h-full object-cover" />}
                      </div>
                      <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5" onClick={() => restartCapture("front")}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake Front Label
                      </Button>
                    </div>

                    <div className="space-y-3">
                      <div className="relative aspect-square rounded-xl overflow-hidden border-2 border-primary/20 bg-primary/5">
                        {images.ingredients && <img src={images.ingredients} alt="Ingredients label" className="w-full h-full object-cover" />}
                      </div>
                      <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/5" onClick={() => restartCapture("ingredients")}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retake Ingredients
                      </Button>
                    </div>
                 </div>

                 <div className="w-full rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-700 dark:text-green-300">
                   <div className="flex items-center gap-2 font-medium">
                     <CheckCircle2 className="h-4 w-4" /> Ready: both required photos are captured.
                   </div>
                 </div>

                 <div className="flex w-full gap-4 pt-2">
                   <Button className="flex-1 h-14 rounded-xl shadow-lg gradient-primary" onClick={analyzeWithVision}>
                     <Sparkles className="w-5 h-5 mr-2" /> Analyze Now
                   </Button>
                 </div>
              </motion.div>
            )}

            {step === "analyzing" && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex flex-col items-center justify-center py-20 space-y-10"
              >
                 <div className="relative h-40 w-40 flex items-center justify-center">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/30"
                   />
                   <motion.div 
                    animate={{ rotate: -360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 rounded-full border-[2px] border-dashed border-primary/20"
                   />
                   <div className="absolute inset-2 rounded-full border-[4px] border-transparent border-t-primary animate-spin" style={{ animationDuration: '1.5s' }}></div>
                   <div className="h-24 w-24 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                     <Sparkles className="h-10 w-10 text-primary relative z-10" />
                   </div>
                 </div>
                 <div className="text-center space-y-4 px-8">
                    <h3 className="text-2xl font-bold font-display tracking-tight text-foreground">AI Neural Engine Processing</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      We're deciphering the ingredients list and cross-referencing with our global nutritional database...
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

