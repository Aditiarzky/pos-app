import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import { StoreSettingType } from "@/lib/validations/settings";

export type StoreSettingResponse = Omit<StoreSettingType, "updatedAt"> & {
  updatedAt: string | Date;
};

export const getStoreSetting = async (): Promise<
  ApiResponse<StoreSettingResponse>
> => {
  const response = await axiosInstance.get("/settings");
  return response.data;
};

export const updateStoreSetting = async ({
  ...data
}: StoreSettingType): Promise<
  ApiResponse<StoreSettingResponse>
> => {
  const response = await axiosInstance.patch(`/settings`, data);
  return response.data;
};
