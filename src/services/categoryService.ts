import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type CategoryResponse = {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getCategories = async (): Promise<
  ApiResponse<CategoryResponse[]>
> => {
  const response = await axiosInstance.get("/master/categories");
  return response.data;
};
