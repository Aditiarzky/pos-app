/**
 * PURCHASE MODULE - TYPE DEFINITIONS
 * Centralized type definitions untuk purchase module
 */

import { PurchaseOrderType } from "@/drizzle/type";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface PurchaseSupplierInfo {
  id: number;
  name: string;
}

export interface PurchaseUserInfo {
  id: number;
  name: string;
}

export interface PurchaseProductInfo {
  id?: number;
  name: string;
  stock?: string;
  averageCost?: string;
}

export interface PurchaseVariantInfo {
  id?: number;
  name: string;
  conversionToBase?: string;
}

export interface PurchaseItemResponse {
  id: number;
  productId: number;
  variantId: number;
  qty: string;
  price: string;
  subtotal: string;
  product?: PurchaseProductInfo;
  productVariant?: PurchaseVariantInfo;
}

export interface PurchaseResponse extends PurchaseOrderType {
  supplier?: PurchaseSupplierInfo;
  user?: PurchaseUserInfo;
  items?: PurchaseItemResponse[];
}

// ============================================
// FORM TYPES
// ============================================

export interface PurchaseFormItem {
  id?: number;
  productId: number;
  variantId: number;
  qty: number;
  price: number;
  productName?: string | null;
  variantName?: string | null;
  image?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants?: any[]; // Using any[] temporarily or import ProductResponse["variants"] if possible, but for now we keep it loose or I will import it. Let's try to be specific if I can import types.
}

export interface PurchaseFormData {
  supplierId: number;
  userId: number;
  items: PurchaseFormItem[];
}

// ============================================
// TABLE/LIST TYPES
// ============================================

export interface PurchaseListItem extends Omit<PurchaseResponse, "items"> {
  itemCount?: number;
}

// ============================================
// QUERY PARAMS TYPES
// ============================================

export interface PurchasesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: number;
  orderBy?: "createdAt" | "orderNumber" | "total";
  order?: "asc" | "desc";
  [key: string]: unknown;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface PurchaseFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: PurchaseResponse | null;
  onSuccess?: () => void;
}

export interface PurchaseListSectionProps {
  onEdit: (purchase: PurchaseResponse) => void;
}

// ============================================
// STATE TYPES
// ============================================

export interface PurchasePageState {
  tab: "history" | "suppliers";
  isPurchaseFormOpen: boolean;
  editingPurchase: PurchaseResponse | null;
  editingSupplierId: number | null;
  isAddSupplierOpen: boolean;
}

// ============================================
// ANALYTICS TYPES
// ============================================

export interface PurchaseAnalytics {
  totalPurchasesThisMonth: number;
  totalPurchasesLastMonth: number;
  newTransactions: number;
  activeSuppliers: number;
}
