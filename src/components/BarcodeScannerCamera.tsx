"use client";

import { useEffect, useRef, useState } from "react";
import { Html5Qrcode } from "html5-qrcode"; // <--- Perhatikan import ini
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Camera, CheckCircle2, XCircle, Loader2, ScanLine } from "lucide-react";
import { cn } from "@/lib/utils";

interface BarcodeScannerCameraProps {
  onScanSuccess: (barcode: string) => void;
  onClose?: () => void;
  className?: string;
}

export default function BarcodeScannerCamera({
  onScanSuccess,
  onClose,
  className,
}: BarcodeScannerCameraProps) {
  const [scanResult, setScanResult] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ID elemen video kita
  const elementId = "scanner-video-container";
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const hasScannedRef = useRef(false);

  // Fungsi untuk memulai scan
  const startScanner = async () => {
    // Pastikan instance dibersihkan jika ada
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop();
    }

    scannerRef.current = new Html5Qrcode(elementId);
    hasScannedRef.current = false;
    setScanResult(null);
    setError(null);
    setIsScanning(true);
    setIsCameraReady(false);

    try {
      // Konfigurasi scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      };

      // Mulai scan
      await scannerRef.current.start(
        { facingMode: "environment" }, // Prioritas kamera belakang
        config,
        (decodedText, decodedResult) => {
          // Callback Success
          if (hasScannedRef.current) return;

          hasScannedRef.current = true;
          setScanResult(decodedText);
          setIsScanning(false);

          // Berhenti scan setelah dapat hasil
          if (scannerRef.current) {
            scannerRef.current
              .stop()
              .catch((err) => console.error("Stop error", err));
          }

          onScanSuccess(decodedText);
        },
        (errorMessage, error) => {
          // Callback Failure (Silent failure agar tidak spam console)
          console.debug(errorMessage);
        },
      );

      setIsCameraReady(true);
    } catch (err) {
      console.error("Error starting scanner:", err);
      setError("Gagal mengakses kamera. Pastikan izin kamera diberikan.");
      setIsScanning(false);
    }
  };

  // Init saat mount
  useEffect(() => {
    startScanner();

    // Cleanup saat unmount
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(console.error);
      }
    };
  }, []);

  const handleReset = () => {
    startScanner();
  };

  const handleClose = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop().catch(console.error);
    }
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
          Arahkan kamera ke barcode atau QR code
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* 
           1. CUSTOM VIDEO CONTAINER 
           Di sini kita memiliki kendali penuh atas UI.
           Kita menambahkan overlay corner frame agar terlihat modern.
        */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border shadow-inner">
          {/* Elemen Video kosong (Target Scan) */}
          <div id={elementId} className="w-full h-full" />

          {/* Loading Indicator */}
          {!isCameraReady && isScanning && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 text-white gap-2">
              <Loader2 className="h-8 w-8 animate-spin" />
              <span className="text-sm">Memuat Kamera...</span>
            </div>
          )}

          {/* Overlay UI (Visual Scanner) */}
          {isCameraReady && (
            <>
              {/* Area Fokus (Corner Brackets) */}
              <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="absolute top-4 left-4 w-12 h-12 border-t-4 border-l-4 border-primary rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-12 h-12 border-t-4 border-r-4 border-primary rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-12 h-12 border-b-4 border-l-4 border-primary rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-12 h-12 border-b-4 border-r-4 border-primary rounded-br-lg" />

                {/* Garis Scan (Animasi) */}
                <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary/50 shadow-[0_0_15px_rgba(var(--primary),0.8)] animate-[scan_2s_ease-in-out_infinite]" />
              </div>

              {/* Label Status */}
              <div className="absolute bottom-6 left-0 right-0 text-center">
                <Badge
                  variant="secondary"
                  className="bg-black/50 text-white border-none backdrop-blur-sm"
                >
                  {isScanning ? "Memindai..." : "Berhenti"}
                </Badge>
              </div>
            </>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}

        {/* Success State */}
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

        {/* Actions */}
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
