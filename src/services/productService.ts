import { ProductType, StockMutationType } from "@/drizzle/type";
import { axiosInstance } from "@/lib/axios";
import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";
import {
  StockAdjustmentInput,
  VariantAdjustmentInput,
} from "@/lib/validations/stock-adjustment";

export interface ProductResponse extends ProductType {
  category?: { name: string };
  unit?: { name: string };
  barcodes?: Array<{
    id: number;
    barcode: string;
  }>;
  variants: Array<{
    id: number;
    name: string;
    sku: string;
    unitId: number;
    conversionToBase: string;
    sellPrice: string;
    isArchived?: boolean;
    unit?: { id: number; name: string };
  }>;
}

export type ProductVariantResponse = ProductResponse["variants"];

export interface StockMutationResponse extends StockMutationType {
  product: {
    name: string;
    sku: string;
  };
  productVariant: {
    name: string;
    sku: string;
    unit: {
      name: string;
    };
  };
  user: {
    name: string;
  };
}

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  analytics?: {
    totalProducts: number;
    totalStock: number;
    underMinimumStock: number;
  };
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  message?: string;
  details?: Record<string, string[]>;
};

// Get all products
export const getProducts = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  orderBy?: string;
  order?: "asc" | "desc";
  // Tambah filter lain
}): Promise<ApiResponse<ProductResponse[]>> => {
  const response = await axiosInstance.get("/products", { params });
  return response.data;
};

// Get single product
export const getProduct = async (
  id: number,
): Promise<ApiResponse<ProductResponse>> => {
  const response = await axiosInstance.get(`/products/${id}`);
  return response.data;
};

// Create product
export const createProduct = async (
  data: InsertProductInputType,
): Promise<ApiResponse<ProductResponse>> => {
  const response = await axiosInstance.post("/products", data);
  return response.data;
};

// Update product
export const updateProduct = async ({
  id,
  ...data
}: { id: number } & UpdateProductInputType): Promise<
  ApiResponse<ProductResponse>
> => {
  const response = await axiosInstance.put(`/products/${id}`, data);
  return response.data;
};

// Delete product
export const deleteProduct = async (id: number): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/products/${id}`);
  return response.data;
};

// Get stock mutations
export const getStockMutations = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  productId?: number;
  type?: string;
}): Promise<ApiResponse<StockMutationResponse[]>> => {
  const response = await axiosInstance.get("/stock-mutations", { params });
  return response.data;
};

// Create stock adjustment
export const createStockAdjustment = async (
  data: StockAdjustmentInput & { productId: number; userId: number },
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.post("/stock-adjustments", data);
  return response.data;
};

// Adjust stock via variants
export const adjustProductStock = async ({
  id,
  ...data
}: { id: number } & VariantAdjustmentInput): Promise<ApiResponse<unknown>> => {
  const response = await axiosInstance.patch(`/products/${id}`, data);
  return response.data;
};
