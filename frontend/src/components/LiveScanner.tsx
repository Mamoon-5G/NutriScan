import { useEffect } from "react";
import { X, Camera } from "lucide-react";
import { Html5Qrcode } from "html5-qrcode";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface Props {
  onDetected: (barcode: string) => void;
  onClose: () => void;
}

const LiveScanner = ({ onDetected, onClose }: Props) => {
  useEffect(() => {
    let isClosed = false;
    const scanner = new Html5Qrcode("camera-reader");

    const onScanSuccess = (decodedText: string) => {
      if (isClosed) return;
      isClosed = true;
      onDetected(decodedText);
      scanner.stop().then(() => scanner.clear()).catch(() => {});
      onClose();
    };

    scanner.start(
      { facingMode: "environment" },
      { fps: 10,  },
      onScanSuccess,
      () => {}
    ).catch(() => {
      if (isClosed) return;
      scanner.start(
        { facingMode: "user" },
        { fps: 10,  },
        onScanSuccess,
        () => {}
      ).catch(console.error);
    });

    return () => {
      isClosed = true;
      if (scanner.isScanning) {
        scanner.stop().then(() => scanner.clear()).catch(() => {});
      } else {
        scanner.clear();
      }
    };
  }, [onClose, onDetected]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="w-full max-w-lg rounded-2xl border border-border bg-card shadow-2xl overflow-hidden glass relative text-card-foreground">
        <div className="flex items-center justify-between px-6 py-5 border-b border-border/50 relative z-20">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold font-display tracking-tight">Live Barcode Scan</h2>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-2 bg-muted/50 rounded-full"
            aria-label="Close barcode scanner"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6 relative">
<div className="relative rounded-xl overflow-hidden border-2 border-border/50 bg-black min-h-[320px] h-[55dvh]">
             <div id="camera-reader" className="w-full h-full" />
            
            {/* Premium UI Overlay */}
            <div className="absolute inset-0 pointer-events-none z-10">
              {/* Corners */}
              <div className="absolute top-10 left-10 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
              <div className="absolute top-10 right-10 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
              <div className="absolute bottom-10 left-10 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
              <div className="absolute bottom-10 right-10 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg shadow-[0_0_15px_rgba(var(--primary),0.5)]"></div>
              
              {/* Animated Scanning Line */}
              <motion.div 
                animate={{ top: ["20%", "80%", "20%"] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-10 right-10 h-[3px] bg-gradient-to-r from-transparent via-primary to-transparent shadow-[0_0_25px_hsl(var(--primary))]"
              />
              
              {/* Scifi Grid overlay */}
              <div className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(var(--primary),0.2)_1px,transparent_1px),linear-gradient(90deg,rgba(var(--primary),0.2)_1px,transparent_1px)] bg-[size:40px_40px]"></div>
              
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[75%] h-[45%] border-2 border-primary/40 rounded-lg bg-primary/5 backdrop-blur-[1px]">
                 <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-[10px] font-black uppercase tracking-widest text-primary-foreground rounded-md">Align Barcode</div>
              </div>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full h-14 rounded-xl shadow-premium font-bold text-md"
            variant="outline"
          >
            Cancel Scan
          </Button>
        </div>
      </div>
    </div>
  );
};

export default LiveScanner;


