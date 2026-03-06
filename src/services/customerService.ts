import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { CustomerData, CustomerUpdateData } from "@/lib/validations/customer";

export type CustomerAnalytics = {
  totalCustomers: number;
  totalDebt: number;
  totalBalance: number;
  newCustomersToday: number;
};

export type CustomerResponse = {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  creditBalance: string;
  totalDebt?: number;
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
): Promise<
  ApiResponse<CustomerResponse[]> & { analytics?: CustomerAnalytics }
> => {
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

export type CustomerBalanceMutation = {
  id: number;
  customerId: number;
  amount: string;
  balanceBefore: string;
  balanceAfter: string;
  type: string;
  referenceId: number | null;
  referenceType: string | null;
  note: string | null;
  createdAt: string;
  userId: number | null;
};

export type CustomerDetailResponse = CustomerResponse & {
  totalDebt: number;
  totalSales: number;
  mutations: CustomerBalanceMutation[];
};

export const getCustomerDetail = async (
  id: number,
): Promise<ApiResponse<CustomerDetailResponse>> => {
  const response = await axiosInstance.get(`/master/customers/${id}`);
  return response.data;
};

export const deleteCustomer = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/master/customers/${id}`);
  return response.data;
};
