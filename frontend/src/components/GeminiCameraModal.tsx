import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, Zap, AlertCircle, CheckCircle, ArrowLeft, RefreshCw, Sparkles, ShieldAlert, Barcode, ArrowRight, HeartPulse } from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

interface GeminiCameraModalProps {
  open: boolean;
  onClose: () => void;
}

type Stage = "camera" | "analyzing" | "result";

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

const parseAnalysis = (text: string) => {
  if (text.trim().toLowerCase() === "invalid" || text.trim().toLowerCase().includes("not a food")) {
    return {
      product: "Not recognized as food",
      classification: "Invalid",
      reason: "Please capture a clear photo of a food item.",
      recommendation: null,
      hasBarcode: false
    };
  }

  const productMatch = text.match(/Product:\s*(.+)/i);
  const classMatch = text.match(/classification:\s*(.+)/i);
  const reasonRawMatch = text.match(/reason:\s*([\s\S]*?)(?=Recommendation:|$)/i);
  const recMatch = text.match(/Recommendation:\s*(.+)/i);
  const hasBarcode = /scan.*?barcode/i.test(text);

  let reason = reasonRawMatch ? reasonRawMatch[1].trim() : text;
  
  return {
    product: productMatch ? productMatch[1].trim() : "Unknown Product",
    classification: classMatch ? classMatch[1].trim() : "Unknown",
    reason: reason.replace(/scan.*?barcode.*/i, '').trim(),
    recommendation: recMatch ? recMatch[1].trim() : null,
    hasBarcode,
  };
};

export const GeminiCameraModal = ({ open, onClose }: GeminiCameraModalProps) => {
  const apiBaseUrl = (import.meta.env.VITE_API_BASE_URL || "").replace(/\/+$/, "");
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<Stage>("camera");
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      if (streamRef.current) {
        stopCamera();
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          facingMode: "environment", 
          width: { ideal: 1920 }, 
          height: { ideal: 1080 },
          aspectRatio: { ideal: 1 } 
        },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(e => console.error("Video play error:", e));
        };
      }
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError("Could not access camera. Please allow camera permission and try again.");
    }
  }, [stopCamera]);

  useEffect(() => {
    if (open) {
      setStage("camera");
      setAnalysisResult(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

  const capturePhoto = async () => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    stopCamera();
    
    setStage("analyzing");
    await analyzeImage(dataUrl);
  };

  const retake = () => {
    setAnalysisResult(null);
    setStage("camera");
    startCamera();
  };

  const analyzeImage = async (imageDataUrl: string) => {
    try {
      const blob = dataUrlToBlob(imageDataUrl);
      const formData = new FormData();
      formData.append("image", blob, "food-capture.jpg");

      const { data } = await axios.post(`${apiBaseUrl}/api/analyze-food`, formData);
      setAnalysisResult(data.analysis);
      setStage("result");
    } catch (err: unknown) {
      const message = axios.isAxiosError(err)
        ? (err.response?.data as { error?: string } | undefined)?.error || err.message
        : err instanceof Error
          ? err.message
          : "Failed to analyze image";
      toast.error(message);
      setStage("camera");
      startCamera();
    }
  };

  const handleClose = () => {
    stopCamera();
    setAnalysisResult(null);
    setStage("camera");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 sm:p-6"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-2xl bg-background rounded-2xl shadow-2xl border border-border flex flex-col overflow-hidden max-h-[94dvh] text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 relative z-20 shrink-0">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-display tracking-tight">AI Vision Analysis</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={handleClose} className="h-10 w-10 p-0 rounded-full bg-primary/10 hover:bg-primary/20 text-primary">
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-0 overflow-y-auto relative flex-1">
          <AnimatePresence mode="wait">
            {stage === "camera" && (
              <motion.div 
                key="camera"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col"
              >
                <div className="relative w-full aspect-square sm:aspect-video bg-black flex items-center justify-center overflow-hidden">
                  {cameraError ? (
                    <div className="flex flex-col items-center justify-center p-8 gap-4 text-center">
                      <AlertCircle className="h-12 w-12 text-destructive" />
                      <p className="text-white/80 font-medium">{cameraError}</p>
                      <Button variant="outline" onClick={startCamera} className="border-white/20 text-white">
                        Retry Camera
                      </Button>
                    </div>
                  ) : (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover"
                      />
                      
                      {/* Premium Scifi Overlay */}
                      <div className="absolute inset-0 pointer-events-none z-10">
                        {/* Corners */}
                        <div className="absolute top-8 left-8 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                        <div className="absolute top-8 right-8 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                        <div className="absolute bottom-8 left-8 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                        <div className="absolute bottom-8 right-8 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
                        
                        {/* Animated Scanning Line */}
                        <motion.div 
                          animate={{ top: ["15%", "85%", "15%"] }}
                          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                          className="absolute left-8 right-8 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_25px_hsl(var(--primary))]"
                        />
                        
                        {/* Grid overlay */}
                        <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(var(--primary),0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
                        
                        <div className="absolute top-6 left-1/2 -translate-x-1/2">
                          <p className="bg-black/60 backdrop-blur-md text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-[0.2em] border border-white/10">
                            Neural Processing Active
                          </p>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="p-6 bg-gradient-to-b from-transparent to-muted/20 flex flex-col gap-4">
                  <div className="flex items-center justify-between text-muted-foreground text-xs px-2">
                    <span className="flex items-center gap-1.5"><Zap size={12} className="text-primary" /> AI Recognition</span>
                    <span className="flex items-center gap-1.5"><CheckCircle size={12} className="text-primary" /> High Confidence</span>
                  </div>
                  
                  {!cameraError && (
                    <div className="flex gap-4">
                      <Button variant="outline" onClick={handleClose} className="flex-1 h-14 rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                        Cancel
                      </Button>
                      <Button
                        onClick={capturePhoto}
                        className="flex-[2] h-14 rounded-xl gradient-primary shadow-lg font-bold text-md gap-3"
                      >
                        <Camera className="h-6 w-6" /> Capture & Analyze
                      </Button>
                    </div>
                  )}
                </div>
                <canvas ref={canvasRef} className="hidden" />
              </motion.div>
            )}

            {stage === "analyzing" && (
              <motion.div 
                key="analyzing"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col items-center justify-center py-20 sm:py-32 space-y-10"
              >
                <div className="relative h-40 w-40 flex items-center justify-center">
                   <motion.div 
                    animate={{ rotate: 360 }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 rounded-full border-[3px] border-dashed border-primary/30"
                   />
                   <div className="absolute inset-2 rounded-full border-[4px] border-transparent border-t-primary animate-spin" style={{ animationDuration: '1.2s' }}></div>
                   <div className="h-24 w-24 bg-primary/10 rounded-xl flex items-center justify-center shadow-inner relative overflow-hidden">
                     <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent animate-pulse" />
                     <Sparkles className="h-10 w-10 text-primary relative z-10" />
                   </div>
                </div>
                <div className="text-center space-y-4 px-8">
                    <h3 className="text-2xl font-bold font-display tracking-tight">Gemini Neural Vision</h3>
                    <p className="text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      We're identifying the food item and calculating its nutritional classification...
                    </p>
                </div>
              </motion.div>
            )}

            {stage === "result" && analysisResult && (
              <motion.div 
                key="result"
                initial={{ opacity: 0, y: 10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className="p-6 sm:p-10 space-y-8"
              >
                 {(() => {
                   const { product, classification, reason, recommendation, hasBarcode } = parseAnalysis(analysisResult);
                   
                   let bgColor = "bg-primary/10";
                   let borderColor = "border-primary/20";
                   let textColor = "text-primary";
                   let statusIcon = <Zap className="h-6 w-6 text-primary" />;
                   let glowColor = "rgba(var(--primary), 0.15)";
                   
                   const clsLower = classification.toLowerCase();
                   if (clsLower.includes("healthy")) {
                     bgColor = "bg-green-500/10";
                     borderColor = "border-green-500/30";
                     textColor = "text-green-600 dark:text-green-400";
                     glowColor = "rgba(34, 197, 94, 0.15)";
                     statusIcon = <CheckCircle className="h-10 w-10 text-green-600 dark:text-green-400" />;
                   } else if (clsLower.includes("moderately")) {
                     bgColor = "bg-yellow-500/10";
                     borderColor = "border-yellow-500/30";
                     textColor = "text-yellow-600 dark:text-yellow-400";
                     glowColor = "rgba(234, 179, 8, 0.15)";
                     statusIcon = <AlertCircle className="h-10 w-10 text-yellow-600 dark:text-yellow-400" />;
                   } else if (clsLower.includes("harmful") || clsLower.includes("invalid")) {
                     bgColor = "bg-red-500/10";
                     borderColor = "border-red-500/30";
                     textColor = "text-red-600 dark:text-red-400";
                     glowColor = "rgba(239, 68, 68, 0.15)";
                     statusIcon = <ShieldAlert className="h-10 w-10 text-red-600 dark:text-red-400" />;
                   }
                   
                   return (
                     <div className="space-y-6 w-full max-w-lg mx-auto relative">
                       {/* Background Glow */}
                       <div 
                         className="absolute inset-0 -z-10 blur-[80px] rounded-full scale-110 pointer-events-none" 
                         style={{ background: glowColor }}
                       />

                       <div className="bg-card/40 backdrop-blur-xl border border-border/60 rounded-3xl overflow-hidden shadow-2xl relative">
                          <div className={`h-2 w-full ${bgColor}`} style={{ filter: 'brightness(1.5)' }} />
                          <div className="p-8 sm:p-10 flex flex-col items-center text-center space-y-6 relative">
                            <motion.div 
                               initial={{ scale: 0.5, opacity: 0 }}
                               animate={{ scale: 1, opacity: 1 }}
                               transition={{ type: "spring", stiffness: 200, damping: 15 }}
                               className={`h-24 w-24 rounded-[2rem] flex items-center justify-center border ${borderColor} ${bgColor} shadow-inner`}
                            >
                              <div className="h-16 w-16 bg-background rounded-2xl shadow-sm flex items-center justify-center">
                                {statusIcon}
                              </div>
                            </motion.div>
                            
                            <div className="space-y-3 w-full">
                              <h3 className="text-3xl font-black font-display tracking-tight bg-clip-text text-transparent bg-gradient-to-br from-foreground to-foreground/60 leading-tight">
                                {product}
                              </h3>
                              <div className={`inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[11px] font-black uppercase tracking-[0.2em] ${bgColor} ${textColor} border ${borderColor} shadow-sm`}>
                                <HeartPulse size={14} /> {classification}
                              </div>
                            </div>
                            
                            <div className="bg-background/60 border border-border/40 p-5 rounded-2xl w-full text-left">
                              <p className="text-[15px] leading-relaxed text-muted-foreground font-medium">
                                {reason}
                              </p>
                            </div>

                            {recommendation && (
                              <div className="w-full bg-primary/5 border border-primary/20 rounded-2xl p-5 text-left flex items-start gap-3">
                                <ArrowRight className="text-primary mt-0.5 shrink-0" size={18} />
                                <div>
                                  <span className="text-xs font-bold text-primary uppercase tracking-wider block mb-1">Healthier Alternative</span>
                                  <p className="text-[14px] text-foreground font-medium">{recommendation}</p>
                                </div>
                              </div>
                            )}

                            {hasBarcode && (
                              <div className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-xl bg-muted/40 border border-border/50 text-sm text-muted-foreground">
                                <Barcode size={16} /> Scan barcode for detailed breakdown
                              </div>
                            )}
                          </div>
                       </div>
                       
                       <div className="flex flex-col sm:flex-row gap-3 pt-2">
                        <Button onClick={handleClose} variant="outline" className="flex-1 h-14 rounded-2xl bg-background hover:bg-muted border-border/60 text-foreground order-2 sm:order-1 font-semibold">
                          Close Dashboard
                        </Button>
                        <Button onClick={retake} className="flex-[1.5] h-14 rounded-2xl gradient-primary shadow-[0_0_20px_rgba(var(--primary),0.3)] font-bold text-white order-1 sm:order-2 group">
                          <RefreshCw className="h-5 w-5 mr-2 group-hover:rotate-180 transition-transform duration-500" /> New Analysis
                        </Button>
                      </div>
                     </div>
                   );
                 })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
