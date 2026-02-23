import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import {
  insertCustomerExchangeItemType,
  insertCustomerReturnItemType,
  insertCustomerReturnType,
} from "@/lib/validations/customer-return";
import { CustomerReturnType } from "@/drizzle/type";

// Define Response Types based on schema relations
export type CustomerReturnResponse = CustomerReturnType & {
  customer?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: Array<
    insertCustomerReturnItemType & {
      product?: { name: string };
      productVariant?: { name: string };
    }
  >;
  exchangeItems: Array<
    insertCustomerExchangeItemType & {
      product?: { name: string };
      productVariant?: { name: string };
    }
  >;
  sales: Array<{
    id: number;
    invoiceNumber: string;
    createdAt: Date;
    customer?: { id: number; name: string };
    user?: { id: number; name: string };
    items?: Array<
      insertCustomerReturnItemType & {
        product?: { name: string };
        productVariant?: { name: string };
      }
    >;
  }>;
};

// Use the type from validation as the payload
export type insertCustomerReturnPayload = insertCustomerReturnType;

export const getCustomerReturns = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  startDate?: string;
  endDate?: string;
  compensationType?: string;
  customerId?: number;
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
