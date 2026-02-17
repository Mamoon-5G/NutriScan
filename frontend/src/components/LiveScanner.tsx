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
    const scanner = new Html5QrcodeScanner(
      "camera-reader",
      {
        fps: 10,
        qrbox: { width: 250, height: 150 },
      },
      false
    );

    scanner.render(
      (decodedText) => {
        onDetected(decodedText);
        scanner.clear();
        onClose();
      },
      () => {}
    );

    return () => {
      scanner.clear().catch(() => {});
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl space-y-4 w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Scan Product Barcode</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <div id="camera-reader" className="rounded-lg overflow-hidden" />
        <Button
          onClick={onClose}
          className="w-full py-2 rounded-lg shadow-soft"
          variant="outline"
        >
          Close Camera
        </Button>
      </div>
    </div>
  );
};

export default LiveScanner;
