// services/userService.ts
import { InsertUserType } from "@/drizzle/type";
import { axiosInstance } from "@/lib/axios";
import { CreateUserInputType, LoginInputType } from "@/lib/validations/user";

export interface UserResponse {
  id?: number;
  email: string;
  name: string;
  roles?: Array<{
    role: "admin toko" | "admin sistem";
  }>;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserRegisterInputType extends InsertUserType {
  roles: ["admin toko" | "admin sistem"];
}

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

// Logout
export const authLogout = async (): Promise<ApiResponse> => {
  const response = await axiosInstance.post("/auth/logout");
  return response.data;
};
