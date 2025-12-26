// services/userService.ts
import { axiosInstance } from "@/lib/axios";
import {
  CreateUserInputType,
  UpdateUserInputType,
  LoginInputType,
  ChangePasswordInputType,
} from "@/lib/validations/user";

export type UserResponse = {
  id: number;
  email: string;
  name: string;
  role: "user" | "admin";
  createdAt: string;
  updatedAt: string;
};

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

// Get all users
export const getUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ApiResponse<UserResponse[]>> => {
  const response = await axiosInstance.get("/users", { params });
  return response.data;
};

// Get single user
export const getUser = async (
  id: number
): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.get(`/users/${id}`);
  return response.data;
};

// Create user
export const createUser = async (
  data: CreateUserInputType
): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.post("/users", data);
  return response.data;
};

// Update user
export const updateUser = async ({
  id,
  ...data
}: { id: number } & UpdateUserInputType): Promise<
  ApiResponse<UserResponse>
> => {
  const response = await axiosInstance.put(`/users/${id}`, data);
  return response.data;
};

// Delete user
export const deleteUser = async (id: number): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.delete(`/users/${id}`);
  return response.data;
};

// Login
export const login = async (
  data: LoginInputType
): Promise<ApiResponse<{ token: string; user: UserResponse }>> => {
  const response = await axiosInstance.post("/auth/login", data);
  return response.data;
};

// Get current user
export const getCurrentUser = async (): Promise<ApiResponse<UserResponse>> => {
  const response = await axiosInstance.get("/auth/me");
  return response.data;
};

// Change password
export const changePassword = async (
  data: ChangePasswordInputType
): Promise<ApiResponse<void>> => {
  const response = await axiosInstance.put("/auth/change-password", data);
  return response.data;
};
