import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { CustomerData, CustomerUpdateData } from "@/lib/validations/customer";

export type CustomerResponse = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  createdAt: string | null;
  updatedAt: string | null;
};

// Simplified query params
export interface GetCustomersParams {
  page?: number;
  limit?: number;
  search?: string;
}

export const getCustomers = async (
  params?: GetCustomersParams,
): Promise<ApiResponse<CustomerResponse[]>> => {
  const response = await axiosInstance.get("/master/customers", { params });
  return response.data;
};

export const createCustomer = async (
  data: CustomerData,
): Promise<ApiResponse<CustomerResponse>> => {
  const response = await axiosInstance.post("/master/customers", data);
  return response.data;
};

export const updateCustomer = async ({
  id,
  ...data
}: { id: number } & CustomerUpdateData): Promise<
  ApiResponse<CustomerResponse>
> => {
  const response = await axiosInstance.patch(`/master/customers/${id}`, data);
  return response.data;
};

export const deleteCustomer = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/master/customers/${id}`);
  return response.data;
};
