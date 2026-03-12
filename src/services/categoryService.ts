import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type CategoryResponse = {
  id: number;
  name: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  usageCount?: number;
};

export type GetCategoriesParams = {
  includeDeleted?: boolean;
  search?: string;
};

export const getCategories = async (
  params?: GetCategoriesParams,
): Promise<
  ApiResponse<CategoryResponse[]>
> => {
  const response = await axiosInstance.get("/categories", { params });
  return response.data;
};

export const createCategory = async (data: {
  name: string;
}): Promise<ApiResponse<CategoryResponse>> => {
  const response = await axiosInstance.post("/categories", data);
  return response.data;
};

export const updateCategory = async ({
  id,
  ...data
}: {
  id: number;
  name: string;
}): Promise<ApiResponse<CategoryResponse>> => {
  const response = await axiosInstance.patch(`/categories/${id}`, data);
  return response.data;
};

export const deleteCategory = async (
  id: number,
): Promise<ApiResponse<CategoryResponse>> => {
  const response = await axiosInstance.delete(`/categories/${id}`);
  return response.data;
};

export const restoreCategory = async (
  id: number,
): Promise<ApiResponse<CategoryResponse>> => {
  const response = await axiosInstance.post(`/categories/${id}/restore`);
  return response.data;
};

export const forceDeleteCategory = async (
  id: number,
): Promise<ApiResponse<CategoryResponse>> => {
  const response = await axiosInstance.delete(`/categories/${id}/force`);
  return response.data;
};
