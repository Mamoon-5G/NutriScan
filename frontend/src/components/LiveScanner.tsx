import { useEffect } from "react";
import { X } from "lucide-react";
import { Html5QrcodeScanner } from "html5-qrcode";
import { Button } from "@/components/ui/button";

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const LiveScanner = ({ onDetected, onClose }: Props) => {
  useEffect(() => {
    let isClosed = false;
    const scanner = new Html5QrcodeScanner(
      "camera-reader",
      {
        fps: 10,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
          const width = Math.max(180, Math.floor(minEdge * 0.82));
          const height = Math.max(110, Math.floor(width * 0.6));
          return { width, height };
        },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        if (isClosed) return;
        isClosed = true;
        onDetected(decodedText);
        scanner.clear().catch(() => {});
        onClose();
      },
      () => {}
    );

    return () => {
      isClosed = true;
      scanner.clear().catch(() => {});
    };
  }, [onClose, onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-2 sm:p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl max-h-[94dvh] overflow-hidden">
        <div className="flex items-center justify-between px-3 sm:px-5 py-3 sm:py-4 border-b border-border">
          <h2 className="text-base sm:text-xl font-bold text-foreground">Scan Product Barcode</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            aria-label="Close barcode scanner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div className="px-3 sm:px-5 pb-4 sm:pb-5 space-y-3 sm:space-y-4 overflow-y-auto max-h-[calc(94dvh-4rem)]">
          <div id="camera-reader" className="scanner-shell rounded-lg overflow-hidden" />
          <Button
            onClick={onClose}
            className="w-full py-2 rounded-lg shadow-soft min-h-11"
            variant="outline"
          >
            Close Camera
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveScanner;
