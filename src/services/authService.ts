// services/userService.ts
import { axiosInstance } from "@/lib/axios";
import { CreateUserInputType, LoginInputType } from "@/lib/validations/user";

export type UserResponse = {
  id: number;
  email: string;
  name: string;
  roles: Array<{
    role: "admin toko" | "admin sistem";
  }>;
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
};

// Login
export const authLogin = async (
  data: LoginInputType,
): Promise<ApiResponse<{ token: string; user: UserResponse }>> => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

// Get current user
export const authMe = async (): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// Register
export const authRegister = async (
  data: CreateUserInputType,
): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.post("/auth/register", data);
  return response.data;
};
