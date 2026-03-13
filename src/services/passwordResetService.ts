import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/services/userService";

export type UserSummary = {
  id: number;
  email: string;
  name: string;
  createdAt?: string;
  updatedAt?: string;
};

export type PasswordResetRequest = {
  id: number;
  userId: number;
  email: string;
  status: "pending" | "completed" | "rejected";
  requestedAt: string;
  resolvedAt?: string | null;
  resolvedBy?: number | null;
  user?: UserSummary;
  resolvedByUser?: UserSummary | null;
};

export type PasswordResetStatus = {
  email: string;
  status: PasswordResetRequest["status"];
  requestedAt: string;
  resolvedAt?: string | null;
};

export const getPasswordResetRequests = async (): Promise<
  ApiResponse<PasswordResetRequest[]>
> => {
  const response = await axiosInstance.get("/password-reset-requests");
  return response.data;
};

export const resolvePasswordResetRequest = async (
  id: number,
): Promise<ApiResponse> => {
  const response = await axiosInstance.put(
    `/password-reset-requests/${id}/resolve`,
  );
  return response.data;
};

export const checkPasswordResetStatus = async (
  email: string,
): Promise<ApiResponse<PasswordResetStatus | null>> => {
  const response = await axiosInstance.get("/password-reset-requests/status", {
    params: { email },
  });
  return response.data;
};
