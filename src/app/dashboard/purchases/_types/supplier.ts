/**
 * SUPPLIER MODULE - TYPE DEFINITIONS
 * Centralized type definitions for supplier module
 */

import { SupplierResponse as ServiceSupplierResponse } from "@/services/supplierService";

// ============================================
// API RESPONSE TYPES
// ============================================

export type SupplierResponse = ServiceSupplierResponse;

export interface SupplierListResponse {
  data: SupplierResponse[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ============================================
// FORM TYPES
// ============================================

export interface SupplierFormData {
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  description?: string;
}

// ============================================
// COMPONENT PROPS TYPES
// ============================================

export interface SupplierFormProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: SupplierResponse | null;
  onSuccess?: () => void;
}

export interface SupplierListSectionProps {
  onEdit: (supplier: SupplierResponse) => void;
  onAddNew: () => void;
}

// ============================================
// QUERY PARAMS TYPES
// ============================================

export interface SuppliersQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: "createdAt" | "name" | "phone";
  order?: "asc" | "desc";
}
