import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type UnitResponse = {
  id: number;
  name: string;
  symbol: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export const getUnits = async (): Promise<ApiResponse<UnitResponse[]>> => {
  const response = await axiosInstance.get("/master/units");
  return response.data;
};

export const createUnit = async (data: {
  name: string;
  symbol: string;
}): Promise<ApiResponse<UnitResponse>> => {
  const response = await axiosInstance.post("/master/units", data);
  return response.data;
};
