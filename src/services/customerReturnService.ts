import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import {
  baseInsertCustomerReturnItemSchema,
  customerExchangeItemInputSchema,
} from "@/lib/validations/customer-return";
import { CompensationTypeEnumType, CustomerReturnType } from "@/drizzle/type";
import z from "zod";

// Define Response Types based on schema relations
export type CustomerReturnResponse = CustomerReturnType & {
  customer?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: Array<insertCustomerReturnItemType>;
};

// 1. Tentukan apa saja yang mau kita buang secara global (kolom internal/audit)
type AuditColumns =
  | "id"
  | "createdAt"
  | "updatedAt"
  | "isArchived"
  | "userId"
  | "returnId";

// 2. Buat tipe untuk Item Retur
export type insertCustomerReturnItemType = Omit<
  z.infer<typeof baseInsertCustomerReturnItemSchema>,
  AuditColumns | "priceAtReturn" | "unitFactorAtReturn" | "qty"
> & {
  productId: number;
  variantId: number;
  qty: number;
  reason?: string | null;
  returnedToStock?: boolean;
};

// 3. Buat tipe untuk Item Tukar (Exchange)
export type insertCustomerExchangeItemType = Omit<
  z.infer<typeof customerExchangeItemInputSchema>,
  AuditColumns | "priceAtExchange" | "unitFactorAtExchange" | "qty"
> & {
  productId: number;
  variantId: number;
  qty: number;
};

// 4. Buat tipe Payload Utama yang akan dikirim Frontend
export type insertCustomerReturnPayload = {
  saleId: number;
  customerId?: number | null;
  userId: number;
  compensationType: CompensationTypeEnumType;
  items: insertCustomerReturnItemType[];
  exchangeItems?: insertCustomerExchangeItemType[];
  // Opsional: tambah field lain jika memang dikirim dari depan
  totalRefund?: number;
  returnNumber?: string;
};

export const getCustomerReturns = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<CustomerReturnResponse[]>> => {
  const response = await axiosInstance.get("/customer-returns", { params });
  return response.data;
};

export const createCustomerReturn = async (
  data: insertCustomerReturnPayload,
): Promise<ApiResponse<CustomerReturnResponse>> => {
  const response = await axiosInstance.post("/customer-returns", data);
  return response.data;
};

export const deleteCustomerReturn = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/customer-returns/${id}`);
  return response.data;
};
