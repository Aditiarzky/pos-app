import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { SupplierData, SupplierUpdateData } from "@/lib/validations/supplier";

export type SupplierResponse = {
  id: number;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getSuppliers = async (): Promise<
  ApiResponse<SupplierResponse[]>
> => {
  const response = await axiosInstance.get("/master/suppliers");
  return response.data;
};

export const createSupplier = async (
  data: SupplierData,
): Promise<ApiResponse<SupplierResponse>> => {
  const response = await axiosInstance.post("/master/suppliers", data);
  return response.data;
};

export const updateSupplier = async ({
  id,
  ...data
}: { id: number } & SupplierUpdateData): Promise<
  ApiResponse<SupplierResponse>
> => {
  const response = await axiosInstance.patch(`/master/suppliers/${id}`, data);
  return response.data;
};

export const deleteSupplier = async (
  id: number,
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/master/suppliers/${id}`);
  return response.data;
};
