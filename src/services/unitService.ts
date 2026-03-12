import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type UnitResponse = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usageCount?: number;
};

export type GetUnitsParams = {
  includeDeleted?: boolean;
  search?: string;
};

export const getUnits = async (
  params?: GetUnitsParams,
): Promise<ApiResponse<UnitResponse[]>> => {
  const response = await axiosInstance.get("/units", { params });
  return response.data;
};

export const createUnit = async (data: {
  name: string;
  symbol?: string;
}): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.post("/units", data);
  return response.data;
};

export const updateUnit = async ({
  id,
  ...data
}: {
  id: number;
  name: string;
}): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.patch(`/units/${id}`, data);
  return response.data;
};

export const deleteUnit = async (
  id: number,
): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.delete(`/units/${id}`);
  return response.data;
};

export const restoreUnit = async (
  id: number,
): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.post(`/units/${id}/restore`);
  return response.data;
};

export const forceDeleteUnit = async (
  id: number,
): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.delete(`/units/${id}/force`);
  return response.data;
};
