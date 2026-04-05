"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/format";
import { getSaleById } from "@/services/saleService";
import {
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  RefreshCw,
  FlaskConical,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { QRCodeSVG } from "qrcode.react";

export interface QrisPaymentData {
  paymentNumber: string;
  expiredAt: string;
  saleId: number;
  invoiceNumber: string;
  amount: number;
  totalPayment?: number;
  fee?: number;
}

interface QrisPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (saleId: number) => void;
  onCancel?: () => void;
  data: QrisPaymentData | null;
}

const POLL_INTERVAL_MS = 3000;
const IS_DEV = process.env.NODE_ENV === "development";

export function QrisPaymentModal({
  isOpen,
  onClose,
  onSuccess,
  onCancel,
  data,
}: QrisPaymentModalProps) {
  const [status, setStatus] = useState<"waiting" | "success" | "expired">(
    "waiting",
  );
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isOpen && data) {
      setStatus("waiting");
      setIsSimulating(false);
      setIsCancelling(false);
    }
  }, [isOpen, data?.saleId, data]);

  // Countdown timer
  useEffect(() => {
    if (!data || !isOpen) return;

    const updateTimer = () => {
      const expiry = new Date(data.expiredAt).getTime();
      const diff = Math.max(0, Math.floor((expiry - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0 && status === "waiting") {
        setStatus("expired");
      }
    };

    updateTimer();
    timerRef.current = setInterval(updateTimer, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [data, isOpen, status]);

  const checkPaymentStatus = useCallback(async () => {
    if (!data || status !== "waiting") return;
    try {
      const res = await getSaleById(data.saleId);
      if (res.data?.status === "completed") {
        setStatus("success");
        if (pollRef.current) clearInterval(pollRef.current);
        setTimeout(() => onSuccess(data.saleId), 1800);
      }
    } catch {
      // abaikan, coba lagi di interval berikutnya
    }
  }, [data, status, onSuccess]);

  useEffect(() => {
    if (!isOpen || status !== "waiting") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    pollRef.current = setInterval(checkPaymentStatus, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [isOpen, status, checkPaymentStatus]);

  useEffect(() => {
    if (!isOpen) {
      if (pollRef.current) clearInterval(pollRef.current);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isOpen]);

  const handleSimulate = async () => {
    if (!data) return;
    setIsSimulating(true);
    const toastId = toast.loading("Mengirim simulasi ke Pakasir...");

    try {
      const res = await fetch("/api/pakasir-simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: data.saleId }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(
          `Server return ${res.status} bukan JSON. ` +
            `Pastikan file app/api/pakasir-simulate/route.ts ada dan Next.js sudah di-restart.`,
        );
      }

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || `HTTP ${res.status}`);

      // Sukses — polling di useEffect akan detect status "completed" dalam ~3 detik
      toast.success("Pembayaran dikonfirmasi, memproses...", { id: toastId });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Simulasi gagal", {
        id: toastId,
        duration: 6000,
      });
    } finally {
      setIsSimulating(false);
    }
  };

  // ── Cancel: call /api/pakasir-cancel → kembalikan stok & saldo ────────────
  const handleCancel = async () => {
    if (!data) return;
    setIsCancelling(true);
    const toastId = toast.loading("Membatalkan transaksi QRIS...");

    try {
      const res = await fetch("/api/pakasir-cancel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ saleId: data.saleId }),
      });

      const contentType = res.headers.get("content-type") ?? "";
      if (!contentType.includes("application/json")) {
        throw new Error(`Server return ${res.status} bukan JSON.`);
      }

      const json = await res.json();
      if (!res.ok || !json.success)
        throw new Error(json.error || `HTTP ${res.status}`);

      toast.success("Transaksi QRIS berhasil dibatalkan", { id: toastId });

      // Tutup modal dan panggil callback
      onClose();
      onCancel?.();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal membatalkan transaksi",
        { id: toastId, duration: 6000 },
      );
    } finally {
      setIsCancelling(false);
    }
  };

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timeStr = `${minutes}:${String(seconds).padStart(2, "0")}`;
  const totalDuration = data
    ? Math.floor(
        (new Date(data.expiredAt).getTime() - Date.now() + secondsLeft * 1000) /
          1000,
      )
    : 300;
  const progress =
    totalDuration > 0 ? Math.min(100, (secondsLeft / totalDuration) * 100) : 0;
  const timerColor = secondsLeft > 60 ? "text-amber-600" : "text-destructive";

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-sm p-0 overflow-hidden">
        <DialogTitle className="sr-only">Pembayaran QRIS</DialogTitle>
        <DialogDescription className="sr-only">
          Scan QR code untuk menyelesaikan pembayaran
        </DialogDescription>

        {/* Header */}
        <div className="bg-primary/5 border-b px-6 py-4 text-center">
          <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-0.5">
            Pembayaran QRIS
          </p>
          {data && (
            <>
              <p className="font-bold text-base">{data.invoiceNumber}</p>
              <p className="text-2xl font-black text-primary mt-1">
                {formatCurrency(data.totalPayment ?? data.amount)}
              </p>
              {data.fee && data.fee > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Termasuk biaya admin {formatCurrency(data.fee)}
                </p>
              )}
            </>
          )}
        </div>

        {/* Body */}
        <div className="px-6 py-5">
          {/* ── Waiting ── */}
          {status === "waiting" && data && (
            <div className="flex flex-col items-center gap-4">
              {/* QR Code */}
              <div className="p-3 border-2 rounded-2xl bg-white shadow-sm">
                <QRCodeSVG
                  value={data.paymentNumber}
                  size={200}
                  style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                />
              </div>

              {/* Timer */}
              <div
                className={cn(
                  "flex items-center gap-1.5 text-sm font-semibold",
                  timerColor,
                )}
              >
                <Clock className="h-4 w-4" />
                <span>QR berlaku {timeStr}</span>
              </div>

              {/* Progress bar */}
              <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn(
                    "h-full rounded-full transition-all duration-1000",
                    secondsLeft > 60 ? "bg-amber-500" : "bg-destructive",
                  )}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Polling indicator */}
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="h-3 w-3 animate-spin" />
                <span>Menunggu konfirmasi pembayaran...</span>
              </div>

              {/* ── SANDBOX: hanya di development ── */}
              {IS_DEV && (
                <div className="w-full rounded-lg border border-dashed border-amber-400 bg-amber-50 dark:bg-amber-950/30 p-3 space-y-2">
                  <p className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                    <FlaskConical className="h-3.5 w-3.5" />
                    Mode Development
                  </p>
                  <p className="text-xs text-amber-600/80 dark:text-amber-500/80">
                    Call Pakasir simulate API.
                  </p>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="w-full border-amber-400 text-amber-700 hover:bg-amber-100 dark:text-amber-400 dark:hover:bg-amber-950"
                    onClick={handleSimulate}
                    disabled={isSimulating || isCancelling}
                  >
                    {isSimulating ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <FlaskConical className="mr-2 h-3.5 w-3.5" />
                    )}
                    Simulasikan Pembayaran
                  </Button>
                </div>
              )}

              {/* Petunjuk */}
              <div className="w-full rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground space-y-1">
                <p className="font-semibold text-foreground">Cara bayar:</p>
                <p>1. Buka aplikasi m-banking atau dompet digital</p>
                <p>2. Pilih Scan QR / QRIS</p>
                <p>3. Arahkan kamera ke QR code di atas</p>
                <p>4. Konfirmasi pembayaran</p>
              </div>

              {/* ── Tombol Cancel ── */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={isCancelling || isSimulating}
                  >
                    {isCancelling ? (
                      <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <X className="mr-2 h-3.5 w-3.5" />
                    )}
                    Batalkan Transaksi
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Batalkan transaksi QRIS?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      Stok akan dikembalikan dan saldo customer (jika ada) akan
                      dikembalikan. Transaksi Pakasir juga akan dibatalkan.
                      Tindakan ini tidak dapat dibatalkan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Ya, Batalkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          )}

          {/* ── Success ── */}
          {status === "success" && (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-emerald-50 p-4">
                <CheckCircle2 className="h-16 w-16 text-emerald-500" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">Pembayaran Berhasil!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Transaksi telah dikonfirmasi
                </p>
              </div>
            </div>
          )}

          {/* ── Expired ── */}
          {status === "expired" && (
            <div className="flex flex-col items-center gap-4 py-4 animate-in fade-in zoom-in-95">
              <div className="rounded-full bg-destructive/10 p-4">
                <XCircle className="h-16 w-16 text-destructive" />
              </div>
              <div className="text-center">
                <p className="font-bold text-xl">QR Code Kadaluarsa</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Waktu pembayaran telah habis
                </p>
              </div>
              {/* Cancel juga tersedia saat expired */}
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
                    disabled={isCancelling}
                  >
                    {isCancelling ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <X className="h-4 w-4" />
                    )}
                    Batalkan & Kembalikan Stok
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Batalkan transaksi QRIS?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      QR sudah kadaluarsa. Stok dan saldo customer akan
                      dikembalikan.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Tidak</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleCancel}
                      className="bg-destructive hover:bg-destructive/90"
                    >
                      Ya, Batalkan
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>

              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full gap-2"
                onClick={onClose}
              >
                <RefreshCw className="h-4 w-4" />
                Tutup & Buat Transaksi Baru
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
