import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { insertPurchaseType } from "@/lib/validations/purchase";

export type PurchaseResponse = {
  id: number;
  invoiceNumber: string;
  supplierId: number;
  userId: number;
  totalAmount: string;
  createdAt: string;
  updatedAt: string;
  supplier?: { name: string };
  user?: { name: string };
  items?: Array<{
    id: number;
    productId: number;
    variantId: number;
    qty: string;
    price: string;
    subtotal: string;
    product?: { name: string };
    variant?: { name: string };
  }>;
};

export const getPurchases = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  supplierId?: number;
}): Promise<ApiResponse<PurchaseResponse[]>> => {
  const response = await axiosInstance.get("/purchases", { params });
  return response.data;
};

export const createPurchase = async (
  data: insertPurchaseType,
): Promise<ApiResponse<PurchaseResponse>> => {
  const response = await axiosInstance.post("/purchases", data);
  return response.data;
};
