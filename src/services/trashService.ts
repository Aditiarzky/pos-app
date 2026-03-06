import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";

export type TrashEntityType = "product" | "sale" | "purchase" | "customer";

export type TrashItemPayload = {
  id: number;
  type: TrashEntityType;
};

export type TrashActionPayload = TrashItemPayload | { items: TrashItemPayload[] };

export type TrashListItem = {
  id: number;
  type: TrashEntityType;
  name: string;
  deleted_at: string | null;
};

export type FetchTrashParams = {
  page?: number;
  limit?: number;
  search?: string;
  type?: TrashEntityType;
};

export type CleanupTrashResponse = {
  processedCount: number;
  deletedCount: number;
  skippedCount: number;
  deleted: TrashItemPayload[];
  skipped: TrashItemPayload[];
};

export const fetchTrash = async (
  params?: FetchTrashParams,
): Promise<ApiResponse<TrashListItem[]>> => {
  const response = await axiosInstance.get("/trash", { params });
  return response.data;
};

export const restoreTrash = async (
  payload: TrashActionPayload,
): Promise<ApiResponse<TrashListItem[]>> => {
  const response = await axiosInstance.post("/trash/restore", payload);
  return response.data;
};

export const forceDeleteTrash = async (
  payload: TrashActionPayload,
): Promise<ApiResponse<TrashListItem[]>> => {
  const response = await axiosInstance.delete("/trash/force-delete", {
    data: payload,
  });
  return response.data;
};

export const bulkRestore = async (
  items: TrashItemPayload[],
): Promise<ApiResponse<TrashListItem[]>> => {
  return restoreTrash({ items });
};

export const bulkForceDelete = async (
  items: TrashItemPayload[],
): Promise<ApiResponse<TrashListItem[]>> => {
  return forceDeleteTrash({ items });
};

export const cleanupExpiredTrash = async (): Promise<
  ApiResponse<CleanupTrashResponse>
> => {
  const response = await axiosInstance.post("/trash/cleanup");
  return response.data;
};
