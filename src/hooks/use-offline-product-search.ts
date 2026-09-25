"use client";

import { useState, useEffect } from "react";
import {
  OfflineProduct,
  syncCatalog,
  lookupProductByBarcode,
  lookupProductByVariantId,
  searchOfflineProducts,
  getCatalogLastUpdated,
} from "@/lib/offline-catalog";
import { toast } from "sonner";

export function useOfflineProductSearch() {
  const [isOffline, setIsOffline] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setIsOffline(!navigator.onLine);
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Initial load timestamp
    (async () => {
      const timestamp = await getCatalogLastUpdated();
      if (timestamp) {
        setLastUpdated(timestamp);
      }
    })();

    // Try sync if online
    if (navigator.onLine) {
      handleSyncCatalog();
    }

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const handleSyncCatalog = async () => {
    if (!navigator.onLine) return;
    setIsSyncing(true);
    try {
      await syncCatalog();
      const now = new Date().toLocaleString("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      });
      await getCatalogLastUpdated();
      setLastUpdated(now);
      toast.success("Katalog offline berhasil diperbarui");
    } catch (error) {
      console.error("Gagal sinkronisasi katalog offline:", error);
    } finally {
      setIsSyncing(false);
    }
  };

  const searchProducts = async (query: string): Promise<OfflineProduct[]> => {
    if (!query.trim()) return [];
    try {
      return await searchOfflineProducts(query);
    } catch (error) {
      console.error("Error searching offline catalog:", error);
      return [];
    }
  };

  const findProductByBarcode = async (barcode: string): Promise<OfflineProduct | null> => {
    if (!barcode) return null;
    try {
      return await lookupProductByBarcode(barcode);
    } catch (error) {
      console.error("Error looking up product by barcode:", error);
      return null;
    }
  };

  const findProductByVariantId = async (variantId: number): Promise<OfflineProduct | null> => {
    try {
      return await lookupProductByVariantId(variantId);
    } catch (error) {
      console.error("Error looking up product by variantId:", error);
      return null;
    }
  };

  return {
    isOffline,
    lastUpdated,
    isSyncing,
    syncCatalog: handleSyncCatalog,
    searchProducts,
    findProductByBarcode,
    findProductByVariantId,
  };
}