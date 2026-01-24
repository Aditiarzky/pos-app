import { axiosInstance } from "@/lib/axios";
import {
  InsertProductInputType,
  UpdateProductInputType,
} from "@/lib/validations/product";

export type ProductResponse = {
  barcodes: any;
  id: number;
  sku: string;
  name: string;
  image?: string;
  minStock: string;
  unitId: number;
  categoryId: number;
  stock: string;
  baseUnitId: number;
  averageCost?: string;
  lastPurchaseCost?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  deletedAt?: string;
  category?: { name: string };
  unit?: { name: string };
  variants: Array<{
    id: number;
    name: string;
    sku: string;
    unitId: number;
    conversionToBase: string;
    sellPrice: string;
    isArchived: boolean;
  }>;
};

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
  allSku?: string[];
  meta?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
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
