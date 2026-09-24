import { offlineDb } from "./offline-db";
import type { OfflineProduct } from "./offline-catalog";

export type OfflineSaleItem = {
  productId: number;
  variantId: number;
  qty: number;
  priceAtSale: number;
  productName: string;
  variantName: string;
};

export type OfflineSale = {
  clientRequestId: string;
  createdOfflineAt: string;
  userId: number;
  customerId?: number;
  customerName?: string;
  paymentMethod: "cash";
  totalPrice: number;
  totalPaid: number;
  totalReturn: number;
  items: OfflineSaleItem[];
  status: "pending" | "synced" | "conflict" | "failed";
  syncedAt?: string;
  saleId?: number;
  invoiceNumber?: string;
  conflictReason?: string;
  errorMessage?: string;
};

/**
 * Queue transaksi cash offline ke IndexedDB
 */
export const queueOfflineSale = async (sale: Omit<OfflineSale, "clientRequestId" | "createdOfflineAt" | "status">): Promise<string> => {
  const clientRequestId = crypto.randomUUID();
  const createdOfflineAt = new Date().toISOString();

  const offlineSale: OfflineSale = {
    ...sale,
    clientRequestId,
    createdOfflineAt,
    status: "pending",
  };

  const db = await offlineDb;
  await db.put("salesQueue", offlineSale);

  console.log(`[Offline Sale] Queued: ${clientRequestId}`, offlineSale);
  return clientRequestId;
};

/**
 * Get all pending offline sales
 */
export const getPendingOfflineSales = async (): Promise<OfflineSale[]> => {
  const db = await offlineDb;
  const allSales = await db.getAll("salesQueue");
  return allSales.filter((s) => s.status === "pending");
};

/**
 * Get all offline sales (any status)
 */
export const getAllOfflineSales = async (): Promise<OfflineSale[]> => {
  const db = await offlineDb;
  return db.getAll("salesQueue");
};

/**
 * Get offline sale by clientRequestId
 */
export const getOfflineSale = async (clientRequestId: string): Promise<OfflineSale | undefined> => {
  const db = await offlineDb;
  return db.get("salesQueue", clientRequestId);
};

/**
 * Update offline sale status
 */
export const updateOfflineSaleStatus = async (
  clientRequestId: string,
  updates: Partial<Pick<OfflineSale, "status" | "syncedAt" | "saleId" | "invoiceNumber" | "conflictReason" | "errorMessage">>
): Promise<void> => {
  const db = await offlineDb;
  const existing = await db.get("salesQueue", clientRequestId);
  if (!existing) {
    throw new Error(`Offline sale not found: ${clientRequestId}`);
  }

  const updated: OfflineSale = {
    ...existing,
    ...updates,
  };

  await db.put("salesQueue", updated);
};

/**
 * Remove synced sales older than N days (cleanup)
 */
export const cleanupSyncedSales = async (daysOld = 7): Promise<number> => {
  const db = await offlineDb;
  const allSales = await db.getAll("salesQueue");
  const cutoff = Date.now() - daysOld * 24 * 60 * 60 * 1000;

  let deleted = 0;
  for (const sale of allSales) {
    if (sale.status === "synced" && sale.syncedAt) {
      const syncedTime = new Date(sale.syncedAt).getTime();
      if (syncedTime < cutoff) {
        await db.delete("salesQueue", sale.clientRequestId);
        deleted++;
      }
    }
  }

  return deleted;
};

/**
 * Decrement local catalog stock optimistically (for UX only)
 */
export const decrementLocalStock = async (items: { variantId: number; qtyBaseUnit: number }[]): Promise<void> => {
  const db = await offlineDb;
  const tx = db.transaction("products", "readwrite");

  for (const item of items) {
    const product = await tx.store.get(item.variantId);
    if (product) {
      const newStock = Math.max(0, product.stock - item.qtyBaseUnit);
      await tx.store.put({
        ...product,
        stock: newStock,
      });
    }
  }

  await tx.done;
};

/**
 * Validate offline sale can be created (basic client-side checks)
 */
export const validateOfflineSale = async (
  items: { variantId: number; qty: number }[]
): Promise<{ valid: boolean; errors: string[] }> => {
  const errors: string[] = [];

  if (items.length === 0) {
    errors.push("Keranjang masih kosong");
  }

  // Check catalog availability
  const db = await offlineDb;
  const catalog = await db.getAll("products");

  if (catalog.length === 0) {
    errors.push("Katalog offline belum tersedia. Harap sync katalog terlebih dahulu saat online.");
    return { valid: false, errors };
  }

  // Validate all items exist in catalog
  for (const item of items) {
    const product = catalog.find((p) => p.variantId === item.variantId);
    if (!product) {
      errors.push(`Produk dengan variantId ${item.variantId} tidak ditemukan di katalog offline`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Get products from offline catalog for receipt
 */
export const getOfflineProductsForReceipt = async (variantIds: number[]): Promise<Map<number, OfflineProduct>> => {
  const db = await offlineDb;
  const productMap = new Map<number, OfflineProduct>();

  for (const variantId of variantIds) {
    const product = await db.get("products", variantId);
    if (product) {
      productMap.set(variantId, product);
    }
  }

  return productMap;
};
