import { useRef, useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Loader2, Camera, X, RotateCcw, Zap, AlertCircle } from "lucide-react";
import { toast } from "sonner";

interface GeminiCameraModalProps {
  open: boolean;
  onClose: () => void;
}

type Stage = "camera" | "preview" | "result";

export const GeminiCameraModal = ({ open, onClose }: GeminiCameraModalProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [stage, setStage] = useState<Stage>("camera");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
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
      setCapturedImage(null);
      setAnalysisResult(null);
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [open, startCamera, stopCamera]);

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
    setCapturedImage(dataUrl);
    stopCamera();
    setStage("preview");
  };

  const retake = () => {
    setCapturedImage(null);
    setAnalysisResult(null);
    setStage("camera");
    startCamera();
  };

  const analyzeImage = async () => {
    if (!capturedImage) return;
    setIsAnalyzing(true);
    try {
      const fetchRes = await fetch(capturedImage);
      const blob = await fetchRes.blob();
      const formData = new FormData();
      formData.append("image", blob, "food-capture.jpg");

      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/analyze-food`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error((errData as { error?: string }).error || "Analysis failed");
      }

      const data = await res.json();
      setAnalysisResult(data.analysis);
      setStage("result");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to analyze image";
      toast.error(message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleClose = () => {
    stopCamera();
    setCapturedImage(null);
    setAnalysisResult(null);
    setStage("camera");
    onClose();
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="relative w-full max-w-lg bg-card rounded-2xl shadow-2xl border border-border overflow-hidden">
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
        <div className="p-5 space-y-4">
          {stage === "camera" && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Point camera at a food item and capture a photo for AI analysis
              </p>
              {cameraError ? (
                <div className="flex flex-col items-center justify-center h-64 rounded-xl bg-muted/50 gap-3 border border-dashed border-border">
                  <AlertCircle className="h-10 w-10 text-destructive" />
                  <p className="text-sm text-muted-foreground text-center px-4">{cameraError}</p>
                  <Button variant="outline" size="sm" onClick={startCamera}>
                    <Camera className="h-4 w-4 mr-2" />
                    Retry Camera
                  </Button>
                </div>
              ) : (
                <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
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

          {stage === "preview" && capturedImage && (
            <div className="space-y-3">
              <p className="text-xs text-muted-foreground text-center">
                Review your photo, then click <strong>Analyze</strong> to get AI insights
              </p>
              <div className="rounded-xl overflow-hidden aspect-video bg-black">
                <img
                  src={capturedImage}
                  alt="Captured food"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={retake} className="flex-1">
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Retake
                </Button>
                <Button
                  onClick={analyzeImage}
                  disabled={isAnalyzing}
                  className="flex-1 gradient-primary shadow-soft font-semibold"
                >
                  {isAnalyzing ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Analyzing...
                    </>
                  ) : (
                    <>
                      <Zap className="h-4 w-4 mr-2" />
                      Analyze with AI
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {stage === "result" && analysisResult && capturedImage && (
            <div className="space-y-4">
              <div className="rounded-xl overflow-hidden max-h-40 bg-black">
                <img
                  src={capturedImage}
                  alt="Analyzed food"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="rounded-xl border border-border bg-muted/30 p-4 max-h-72 overflow-y-auto">
                <div className="flex items-center gap-2 mb-3">
                  <Zap className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-semibold">AI Analysis Result</span>
                </div>
                <div className="text-sm whitespace-pre-wrap text-foreground leading-relaxed">
                  {analysisResult}
                </div>
              </div>
              <Button variant="outline" onClick={retake} className="w-full">
                <Camera className="h-4 w-4 mr-2" />
                Analyze Another Food
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
