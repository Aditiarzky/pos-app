"use client";

import { useState, useEffect, useCallback } from "react";
import {
  OfflineSale,
  getPendingOfflineSales,
  getAllOfflineSales,
  queueOfflineSale,
  decrementLocalStock,
  validateOfflineSale,
} from "@/lib/offline-sales-queue";
import { toast } from "sonner";

export function useOfflineSales() {
  const [isOffline, setIsOffline] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [pendingSales, setPendingSales] = useState<OfflineSale[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Update online/offline status
  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Refresh pending count
  const refreshPendingSales = useCallback(async () => {
    try {
      const sales = await getPendingOfflineSales();
      setPendingSales(sales);
      setPendingCount(sales.length);
    } catch (error) {
      console.error("Gagal membaca pending offline sales:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Poll or refresh on mount/status change
  useEffect(() => {
    refreshPendingSales();
  }, [refreshPendingSales, isOffline]);

  // Create an offline sale
  const createOfflineSale = async (
    saleData: Omit<OfflineSale, "clientRequestId" | "createdOfflineAt" | "status">
  ): Promise<{ success: boolean; clientRequestId?: string; error?: string }> => {
    try {
      // Basic validations
      const validation = await validateOfflineSale(
        saleData.items.map((i) => ({ variantId: i.variantId, qty: i.qty }))
      );

      if (!validation.valid) {
        return {
          success: false,
          error: validation.errors.join(", "),
        };
      }

      // Add to queue
      const clientRequestId = await queueOfflineSale(saleData);

      // Decrement local stock for UX
      await decrementLocalStock(
        saleData.items.map((i) => ({
          variantId: i.variantId,
          qtyBaseUnit: i.qty, // Assumed 1:1 for simplicity
        }))
      );

      // Refresh list
      await refreshPendingSales();

      toast.success("Transaksi disimpan ke antrean offline", {
        description: "Akan otomatis disinkronkan saat kembali online.",
      });

      return {
        success: true,
        clientRequestId,
      };
    } catch (error) {
      console.error("Error creating offline sale:", error);
      const msg = error instanceof Error ? error.message : "Gagal menyimpan transaksi offline";
      toast.error(msg);
      return {
        success: false,
        error: msg,
      };
    }
  };

  return {
    isOffline,
    pendingCount,
    pendingSales,
    isLoading,
    refreshPendingSales,
    createOfflineSale,
  };
}
