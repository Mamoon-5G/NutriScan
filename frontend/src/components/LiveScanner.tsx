import { useEffect } from "react";
import { Html5QrcodeScanner } from "html5-qrcode";

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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white p-4 rounded-xl space-y-4 w-[350px]">
        <div id="camera-reader" />
        <button
          onClick={onClose}
          className="w-full py-2 rounded bg-red-500 text-white font-semibold"
        >
          Close Camera
        </button>
      </div>
    </div>
  );
};

export default LiveScanner;
