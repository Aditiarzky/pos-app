/**
 * SALE MODULE - TYPE DEFINITIONS
 */

import { DebtType, SaleType } from "@/drizzle/type";

// ============================================
// API RESPONSE TYPES
// ============================================

export interface SaleCustomerInfo {
  id: number;
  name: string;
}

export interface SaleUserInfo {
  id: number;
  name: string;
}

export interface SaleProductInfo {
  id?: number;
  name: string;
  stock?: string;
  averageCost?: string;
}

export interface SaleVariantInfo {
  id?: number;
  name: string;
  sellPrice?: string;
  conversionToBase?: string;
  sku?: string;
}

export interface SaleItemResponse {
  id: number;
  productId: number;
  variantId: number;
  qty: string;
  priceAtSale: string;
  subtotal: string;
  product?: SaleProductInfo;
  productVariant?: SaleVariantInfo;
}

export interface SaleResponse extends SaleType {
  customer?: SaleCustomerInfo;
  user?: SaleUserInfo;
  items?: SaleItemResponse[];
  debt?: DebtType;
}

// ============================================
// FORM TYPES
// ============================================

export interface SaleFormItem {
  id?: number; // for field array key
  productId: number;
  variantId: number;
  qty: number;
  price: number; // Price per unit
  productName?: string | null;
  variantName?: string | null;
  sku?: string | null;
  currentStock?: number;
  image?: string | null;
  conversionToBase: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants?: any[];
}

export interface SaleFormData {
  customerId?: number;
  userId: number;
  items: SaleFormItem[];
  totalPaid: number;
  totalBalanceUsed: number;
  shouldPayOldDebt?: boolean;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface SaleFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  // Sale form usually doesn't need initialData for Create, but might for Edit (if supported)
  initialData?: SaleResponse | null;
}

// export interface SaleListSectionProps {
//   // Add props if needed
// }
