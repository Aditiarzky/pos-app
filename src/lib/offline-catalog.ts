import { offlineDb } from "./offline-db";

export type OfflineProduct = {
  productId: number;
  variantId: number;
  barcode: string | null;
  name: string;
  variantName: string;
  sellPrice: number;
  stock: number;
  unit: string;
  updatedAt: string;
};

export const syncCatalog = async (): Promise<void> => {
  try {
    const response = await fetch("/api/products/offline-catalog");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result = await response.json() as { success: boolean; data: OfflineProduct[] };

    if (result.success && result.data) {
      const db = await offlineDb;
      const tx = db.transaction(["products", "metadata"], "readwrite");
      
      // Clear existing catalog
      await tx.objectStore("products").clear();
      
      // Insert new catalog data
      for (const product of result.data) {
        await tx.objectStore("products").put(product);
      }
      
      // Save timestamp
      const now = new Date().toISOString();
      await tx.objectStore("metadata").put({ key: "catalogLastUpdated", value: now });
      
      await tx.done;
      console.log("Offline catalog synced successfully.");
    } else {
      throw new Error("Failed to sync offline catalog: API returned not success.");
    }
  } catch (error) {
    console.error("Error syncing offline catalog:", error);
    throw error; // Re-throw to allow caller to handle
  }
};

export const lookupProductByBarcode = async (barcode: string): Promise<OfflineProduct | null> => {
  if (!barcode) return null;
  try {
    const db = await offlineDb;
    const products = await db.getAll("products");
    return products.find(p => p.barcode === barcode) || null;
  } catch (error) {
    console.error("Error looking up product by barcode:", error);
    return null;
  }
};

export const lookupProductByVariantId = async (variantId: number): Promise<OfflineProduct | null> => {
  try {
    const db = await offlineDb;
    const product = await db.get("products", variantId); // variantId is keyPath
    return product || null;
  } catch (error) {
    console.error("Error looking up product by variantId:", error);
    return null;
  }
};

export const searchOfflineProducts = async (query: string): Promise<OfflineProduct[]> => {
  if (!query.trim()) return [];
  try {
    const db = await offlineDb;
    const allProducts = await db.getAll("products");
    const lower = query.toLowerCase();
    return allProducts.filter(
      (p) => 
        p.name.toLowerCase().includes(lower) ||
        p.variantName.toLowerCase().includes(lower) ||
        (p.barcode && p.barcode.toLowerCase().includes(lower))
    );
  } catch (error) {
    console.error("Error searching offline catalog:", error);
    return [];
  }
};

export const getCatalogLastUpdated = async (): Promise<string | null> => {
  try {
    const db = await offlineDb;
    const metadata = await db.get("metadata", "catalogLastUpdated");
    return metadata ? metadata.value : null;
  } catch (error) {
    console.error("Error getting catalog last updated:", error);
    return null;
  }
};