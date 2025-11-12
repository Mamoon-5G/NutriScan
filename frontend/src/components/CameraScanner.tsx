import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from 'lucide-react';

interface CameraScannerProps {
  onDetected: (code: string) => void;
  onClose: () => void;
}

export const CameraScanner: React.FC<CameraScannerProps> = ({ onDetected, onClose }) => {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let animationId: number;
    let mounted = true;

    const startCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        if (!mounted) return;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
        }

        const scan = () => {
          if (!videoRef.current || videoRef.current.readyState !== HTMLMediaElement.HAVE_ENOUGH_DATA) {
            animationId = requestAnimationFrame(scan);
            return;
          }

          const video = videoRef.current;
          const canvas = canvasRef.current;
          if (!canvas) return;

          const ctx = canvas.getContext('2d');
          if (!ctx) return;

          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code && code.data) {
            onDetected(code.data);
          } else {
            animationId = requestAnimationFrame(scan);
          }
        };

        animationId = requestAnimationFrame(scan);
      } catch (err: any) {
        console.error('Camera error', err);
        setError('Unable to access camera. Please allow camera permission or use manual entry.');
      }
    };

    startCamera();

    return () => {
      mounted = false;
      if (animationId) cancelAnimationFrame(animationId);
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  return (
    <Card className="shadow-medium border-border/50">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Camera Scanner</CardTitle>
          <Button variant="ghost" onClick={onClose}><X /></Button>
        </div>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-center text-sm text-red-500">{error}</div>
        ) : (
          <div className="relative">
            <video ref={videoRef} className="w-full rounded" playsInline />
            <canvas ref={canvasRef} className="hidden" />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CameraScanner;