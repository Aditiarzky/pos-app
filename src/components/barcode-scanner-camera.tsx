"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import dynamic from "next/dynamic";
import type {
  IDetectedBarcode,
  IScannerHandle,
} from "@yudiel/react-qr-scanner";
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
  SwitchCamera,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Wajib di-load secara dinamis (client-only), karena library ini
// mengakses API browser (getUserMedia, dsb) yang tidak ada di server.
const Scanner = dynamic(
  () => import("@yudiel/react-qr-scanner").then((m) => m.Scanner),
  { ssr: false },
);

type FacingMode = "environment" | "user";

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
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime);
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
  const [isPaused, setIsPaused] = useState(false);
  const [isCameraReady, setIsCameraReady] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [facingMode, setFacingMode] = useState<FacingMode>("environment");

  const scannerRef = useRef<IScannerHandle>(null);

  // Deteksi kamera sudah siap (library tidak punya callback "ready" resmi,
  // jadi kita pantau elemen video-nya langsung). Dijalankan ulang tiap kali
  // facingMode berubah karena Scanner di-remount (key={facingMode}).
  useEffect(() => {
    setIsCameraReady(false);

    let pollId: ReturnType<typeof setInterval> | null = null;
    let videoEl: HTMLVideoElement | null = null;

    const handlePlaying = () => setIsCameraReady(true);

    pollId = setInterval(() => {
      const video = scannerRef.current?.getVideoElement() ?? null;
      if (video) {
        videoEl = video;
        if (video.readyState >= 2) {
          setIsCameraReady(true);
        }
        video.addEventListener("playing", handlePlaying);
        if (pollId) clearInterval(pollId);
      }
    }, 150);

    return () => {
      if (pollId) clearInterval(pollId);
      videoEl?.removeEventListener("playing", handlePlaying);
    };
  }, [facingMode]);

  // Toggle Lampu (Torch) — lewat MediaStreamTrack langsung
  const toggleTorch = async () => {
    const stream = scannerRef.current?.getStream();
    const track = stream?.getVideoTracks?.()[0];

    if (!track) {
      setError("Kamera belum siap.");
      return;
    }

    try {
      const newState = !torchEnabled;
      await track.applyConstraints({
        advanced: [{ torch: newState } as unknown as MediaTrackConstraints],
      });
      setTorchEnabled(newState);
    } catch (err) {
      console.warn("Torch tidak didukung perangkat ini", err);
      setError("Lampu kamera tidak didukung di perangkat ini.");
    }
  };

  // Ganti kamera depan / belakang
  const toggleCamera = () => {
    setError(null);
    setTorchEnabled(false);
    setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
  };

  const handleScan = useCallback(
    (detectedCodes: IDetectedBarcode[]) => {
      if (!detectedCodes.length || scanResult) return;

      const decodedText = detectedCodes[0].rawValue;

      playBeep();
      setScanResult(decodedText);
      setIsPaused(true);
      setTorchEnabled(false);
      onScanSuccess(decodedText);
    },
    [scanResult, onScanSuccess],
  );

  const handleError = (err: unknown) => {
    console.error("Error starting scanner:", err);
    setError("Gagal mengakses kamera.");
  };

  const handleReset = () => {
    setScanResult(null);
    setError(null);
    setIsPaused(false);
  };

  const handleClose = () => {
    setIsPaused(true);
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
        </div>
        <CardDescription>
          Arahkan kamera ke barcode. Anda bisa memindai di area mana saja.
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden border border-border shadow-inner">
          <Scanner
            key={facingMode}
            ref={scannerRef}
            onScan={handleScan}
            onError={handleError}
            paused={isPaused}
            constraints={{ facingMode }}
            sound={false}
            components={{
              onOff: false,
              torch: false,
              zoom: false,
              finder: false,
            }}
            classNames={{
              container: "!w-full !h-full",
              video: "!w-full !h-full !object-cover",
            }}
            styles={{
              container: { width: "100%", height: "100%" },
            }}
          />

          {!isCameraReady && !isPaused && (
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

              {/* Tombol Torch & Switch Kamera */}
              <div className="absolute top-4 right-4 flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="rounded-full h-10 w-10 bg-black/20 backdrop-blur text-white border border-white/20 hover:bg-black/40"
                  onClick={toggleCamera}
                  title="Ganti kamera depan/belakang"
                >
                  <SwitchCamera className="h-4 w-4" />
                </Button>

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
                  title="Nyalakan/matikan lampu"
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
    </Card>
  );
}
