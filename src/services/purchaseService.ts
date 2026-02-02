import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { insertPurchaseType } from "@/lib/validations/purchase";
import { PurchaseOrderType } from "@/drizzle/type";

export interface PurchaseResponse extends PurchaseOrderType {
  supplier?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: Array<{
    id: number;
    productId: number;
    variantId: number;
    qty: string;
    price: string;
    subtotal: string;
    product?: {
      id?: number;
      name: string;
      stock?: string;
      averageCost?: string;
    };
    productVariant?: { id?: number; name: string; conversionToBase: string };
  }>;
}

export type PurchaseResponseItem = PurchaseResponse["items"];

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

export const updatePurchase = async ({
  id,
  ...data
}: { id: number } & insertPurchaseType): Promise<
  ApiResponse<PurchaseResponse>
> => {
  const response = await axiosInstance.put(`/purchases/${id}`, data);
  return response.data;
};

export const deletePurchase = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/purchases/${id}`);
  return response.data;
};
