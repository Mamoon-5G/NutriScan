import { useRef, useState, useEffect, useCallback } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, Zap, AlertCircle, CheckCircle } from "lucide-react";
import { toast } from "sonner";

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
  if (text.trim().toLowerCase() === "invalid") {
    return {
      product: "Not recognized as food",
      classification: "Invalid",
      reason: "Please capture a clear photo of a food item.",
    };
  }

  const productMatch = text.match(/Product:\s*(.+)/i);
  const classMatch = text.match(/classification:\s*(.+)/i);
  const reasonMatch = text.match(/reason:\s*(.+)/i);

  return {
    product: productMatch ? productMatch[1].trim() : "Unknown Product",
    classification: classMatch ? classMatch[1].trim() : "Unknown",
    reason: reasonMatch ? reasonMatch[1].trim() : text,
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
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch {
      setCameraError("Could not access camera. Please allow camera permission and try again.");
    }
  }, []);

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
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-2xl bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">AI Food Analyzer</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="h-8 w-8 p-0 rounded-full">
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* Body */}
        <div className="p-3 sm:p-5 space-y-4">
          {stage === "camera" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Point camera at a food item and capture a photo for AI analysis
              </p>
              {cameraError ? (
                <div className="flex flex-col items-center justify-center min-h-[320px] sm:min-h-[400px] rounded-xl bg-muted/50 gap-3 border border-dashed border-border">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground text-center px-4">{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Retry Camera
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-[4/3] min-h-[320px] sm:min-h-[400px] flex items-center justify-center">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Viewfinder overlay */}
                  <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none" />
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />
              {!cameraError && (
                <Button
                  onClick={capturePhoto}
                  className="w-full gradient-primary shadow-soft font-semibold"
                >
                  <Camera className="h-4 w-4 mr-2" />
                  Capture Photo
                </Button>
              )}
            </div>
          )}

          {stage === "analyzing" && (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="relative">
                <div className="absolute inset-0 rounded-full blur-xl bg-primary/20 animate-pulse" />
                <Loader2 className="h-12 w-12 text-primary animate-spin relative z-10" />
              </div>
              <p className="text-lg font-medium animate-pulse">Analyzing with AI...</p>
              <p className="text-sm text-muted-foreground">Identifying food and health impact</p>
            </div>
          )}

          {stage === "result" && analysisResult && (
            <div className="space-y-4">
               {(() => {
                 const { product, classification, reason } = parseAnalysis(analysisResult);
                 
                 let bgColor = "bg-muted/30";
                 let borderColor = "border-border";
                 let textColor = "text-foreground";
                 let icon = <Zap className="h-6 w-6 text-primary" />;
                 
                 const clsLower = classification.toLowerCase();
                 if (clsLower.includes("healthy")) {
                   bgColor = "bg-green-500/10";
                   borderColor = "border-green-500/30";
                   textColor = "text-green-600 dark:text-green-400";
                   icon = <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center"><CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" /></div>;
                 } else if (clsLower.includes("moderately")) {
                   bgColor = "bg-yellow-500/10";
                   borderColor = "border-yellow-500/30";
                   textColor = "text-yellow-600 dark:text-yellow-400";
                   icon = <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" /></div>;
                 } else if (clsLower.includes("harmful") || clsLower.includes("invalid")) {
                   bgColor = "bg-red-500/10";
                   borderColor = "border-red-500/30";
                   textColor = "text-red-600 dark:text-red-400";
                   icon = <div className="h-12 w-12 rounded-full bg-red-500/20 flex items-center justify-center"><AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" /></div>;
                 }
                 
                 return (
                   <div className={`rounded-xl border ${borderColor} ${bgColor} p-6 flex flex-col items-center text-center space-y-4 transition-all duration-500 animate-in fade-in zoom-in-95`}>
                      {icon}
                      <div>
                        <h3 className="text-xl font-bold">{product}</h3>
                        <p className={`text-sm font-bold mt-1 uppercase tracking-wider ${textColor}`}>
                          {classification}
                        </p>
                      </div>
                      <p className="text-sm leading-relaxed max-w-sm text-muted-foreground font-medium">
                        {reason}
                      </p>
                   </div>
                 );
               })()}
               
              <Button onClick={retake} className="w-full gradient-primary shadow-soft font-semibold text-white hover:opacity-90 transition-opacity">
                <Camera className="h-4 w-4 mr-2" />
                {analysisResult.toLowerCase().includes("invalid") ? "Try Again" : "Analyze Another Food"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
