"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from "html5-qrcode";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Camera,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  ScanLine,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerCameraProps {
  onScanSuccess: (barcode: string) => void;
  onClose?: () => void;
  className?: string;
}

// Fungsi untuk membuat suara Beep tanpa file eksternal
const playBeep = () => {
  try {
    const AudioContext =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: AudioContext })
        .webkitAudioContext;
    if (!AudioContext) return;

    const audioCtx = new AudioContext();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // Frekuensi tinggi
    oscillator.frequency.exponentialRampToValueAtTime(
      440,
      audioCtx.currentTime + 0.1,
    );

    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.01,
      audioCtx.currentTime + 0.1,
    );

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    console.error("Audio error", e);
  }
};

export default function BarcodeScannerCamera({
  onScanSuccess,
  onClose,
  className,
}: BarcodeScannerCameraProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false); // State Torch

  const elementId = "scanner-video-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isTransitioning = useRef(false);
  const isMountedRef = useRef(true);

  // Toggle Lampu (Torch)
  const toggleTorch = async () => {
    if (!scannerRef.current) return;

    try {
      const newState = !torchEnabled;

      // Apply constraints ke kamera
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: newState } as unknown as MediaTrackConstraints],
      });

      setTorchEnabled(newState);
    } catch (err) {
      console.warn("Torch tidak didukung perangkat ini", err);
      setError("Lampu kamera tidak didukung di perangkat ini.");
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    startScanner();

    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (isTransitioning.current) return;

    isTransitioning.current = true;
    try {
      if (scannerRef.current) {
        // Hanya stop jika statusnya memang sedang scanning
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        await scannerRef.current.clear();
        scannerRef.current = null;
      }

      // Pembersihan manual MediaTracks (Paling ampuh mematikan lampu indikator browser)
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video) => {
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => {
            track.stop();
            track.enabled = false;
          });
          video.srcObject = null;
        }
      });
    } catch (err) {
      console.error("Gagal menghentikan kamera:", err);
    } finally {
      isTransitioning.current = false;
    }
  };

  const startScanner = async () => {
    if (isTransitioning.current || !isMountedRef.current) return;

    isTransitioning.current = true;
    try {
      // Pastikan bersih sebelum mulai
      if (scannerRef.current?.isScanning) {
        await scannerRef.current.stop();
      }

      scannerRef.current = new Html5Qrcode(elementId);
      setScanResult(null);
      setError(null);
      setIsScanning(true);

      const config: Html5QrcodeCameraScanConfig = {
        fps: 20,
        qrbox: undefined,
        aspectRatio: 1.0,
      };

      await scannerRef.current.start(
        { facingMode: "environment" },
        config,
        async (decodedText) => {
          // Stop kamera segera setelah sukses
          playBeep();
          setScanResult(decodedText);
          setIsScanning(false);

          // Penting: panggil stop secara eksplisit
          await stopScanner();
          onScanSuccess(decodedText);
        },
        () => {},
      );

      setIsCameraReady(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Gagal mengakses kamera.");
      setIsScanning(false);
    } finally {
      isTransitioning.current = false;
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      stopScanner();
    };
  }, []);

  const handleReset = () => {
    startScanner();
  };

  const handleClose = async () => {
    await stopScanner();
    onClose?.();
  };

  return (
    <Card className={cn("w-full max-w-lg mx-auto overflow-hidden", className)}>
      <CardHeader className="space-y-2 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Camera className="h-5 w-5 text-primary" />
            <CardTitle>Scan Barcode</CardTitle>
          </div>
          {onClose && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="h-8 w-8"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
        <CardDescription>
          Arahkan kamera ke barcode. Anda bisa memindai di area mana saja.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border shadow-inner">
          <div id={elementId} className="w-full h-full" />

          {!isCameraReady && isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Memuat Kamera...</span>
            </div>
          )}

          {isCameraReady && (
            <>
              {/* UI Overlay (Corner lebih simpel, karena scan full frame) */}
              <div className="absolute inset-0 z-0 pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[60%] border-2 border-white/30 rounded-lg border-dashed flex items-center justify-center relative">
                  <div className="text-center">
                    <ScanLine className="h-8 w-8 text-white/50 mx-auto mb-2" />
                    <span className="text-xs text-white/60">
                      Area Scan Aktif
                    </span>
                  </div>
                </div>
              </div>

              {/* Tombol Torch (Muncul jika kamera aktif) */}
              <div className="absolute top-4 right-4">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className={cn(
                    "rounded-full h-10 w-10 bg-black/20 backdrop-blur text-white border border-white/20 hover:bg-black/40",
                    torchEnabled &&
                      "bg-yellow-500/80 text-white border-yellow-500 hover:bg-yellow-600",
                  )}
                  onClick={toggleTorch}
                >
                  <Zap
                    className={cn("h-4 w-4", torchEnabled && "fill-current")}
                  />
                </Button>
              </div>
            </>
          )}
        </div>

        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {scanResult && (
          <Alert className="border-green-500 bg-green-50 dark:bg-green-950/20">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <AlertDescription className="flex flex-col gap-1">
              <span className="font-medium text-green-900 dark:text-green-100">
                Scan Berhasil!
              </span>
              <span className="text-xs text-green-700 dark:text-green-300 font-mono break-all">
                {scanResult}
              </span>
            </AlertDescription>
          </Alert>
        )}

        <div className="flex gap-2 pt-2">
          {scanResult && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="flex-1"
              >
                Scan Lagi
              </Button>
              <Button type="button" onClick={handleClose} className="flex-1">
                Simpan
              </Button>
            </>
          )}
        </div>
      </CardContent>

      <style jsx global>{`
        @keyframes scan {
          0%,
          100% {
            top: 10%;
            opacity: 0;
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          50% {
            top: 90%;
          }
        }
      `}</style>
    </Card>
  );
}
