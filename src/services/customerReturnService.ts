import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import {
  insertCustomerReturnItemType,
  insertCustomerReturnType,
} from "@/lib/validations/customer-return";
import { CustomerReturnItemType, CustomerReturnType } from "@/drizzle/type";

// Define Response Types based on schema relations
export type CustomerReturnResponse = CustomerReturnType & {
  customer?: { id: number; name: string };
  user?: { id: number; name: string };
  items?: Array<insertCustomerReturnItemType>;
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
  data: insertCustomerReturnType,
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
