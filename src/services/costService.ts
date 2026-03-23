import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "./productService";
import {
  OperationalCostType,
  UpdateOperationalCostType,
} from "@/lib/validations/operational-cost";
import {
  TaxConfigType,
  UpdateTaxConfigType,
} from "@/lib/validations/tax-config";

// ── Types ─────────────────────────────────────────────────────────────────────

export type CostCategory =
  | "utilities"
  | "salary"
  | "rent"
  | "logistics"
  | "marketing"
  | "maintenance"
  | "other";

export type CostPeriod =
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "one_time";

export type TaxType = "percentage" | "fixed";
export type TaxAppliesTo = "revenue" | "gross_profit";

export interface OperationalCost {
  id: number;
  name: string;
  category: CostCategory;
  amount: string;
  period: CostPeriod;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: number; name: string } | null;
}

export interface TaxConfig {
  id: number;
  name: string;
  type: TaxType;
  rate: string | null;
  fixedAmount: string | null;
  appliesTo: TaxAppliesTo | null;
  period: CostPeriod | null;
  effectiveFrom: string;
  effectiveTo: string | null;
  isActive: boolean;
  notes: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
  creator?: { id: number; name: string } | null;
}

export interface CostAnalytics {
  generatedAt: string;
  asOfDate: string; // YYYY-MM-DD
  operational: {
    activeCount: number;
    inactiveCount: number;
    activeMonthlyEstimate: number;
    activeOneTimeCount: number;
    activeOneTimeTotal: number;
    expiringNext30DaysCount: number;
    topCategories: Array<{ category: CostCategory; monthlyEstimate: number }>;
  };
  tax: {
    activeCount: number;
    inactiveCount: number;
    activeFixedCount: number;
    activeFixedMonthlyEstimate: number;
    activePercentageCount: number;
    percentageAppliesToCount: Record<TaxAppliesTo, number>;
    expiringNext30DaysCount: number;
  };
}

export interface GetOperationalCostsParams {
  search?: string;
  category?: CostCategory;
  period?: CostPeriod;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

export interface GetTaxConfigsParams {
  search?: string;
  type?: TaxType;
  appliesTo?: TaxAppliesTo;
  isActive?: boolean;
  page?: number;
  limit?: number;
}

// ── Operational Costs ─────────────────────────────────────────────────────────

export const getOperationalCosts = async (
  params?: GetOperationalCostsParams,
): Promise<ApiResponse<OperationalCost[]>> => {
  const response = await axiosInstance.get("/operational-costs", { params });
  return response.data;
};

export const getOperationalCostById = async (
  id: number,
): Promise<ApiResponse<OperationalCost>> => {
  const response = await axiosInstance.get(`/operational-costs/${id}`);
  return response.data;
};

export const createOperationalCost = async (
  data: OperationalCostType,
): Promise<ApiResponse<OperationalCost>> => {
  const response = await axiosInstance.post("/operational-costs", data);
  return response.data;
};

export const updateOperationalCost = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateOperationalCostType;
}): Promise<ApiResponse<OperationalCost>> => {
  const response = await axiosInstance.patch(`/operational-costs/${id}`, data);
  return response.data;
};

export const deleteOperationalCost = async (
  id: number,
): Promise<ApiResponse<{ message: string }>> => {
  const response = await axiosInstance.delete(`/operational-costs/${id}`);
  return response.data;
};

// ── Tax Configs ───────────────────────────────────────────────────────────────

export const getTaxConfigs = async (
  params?: GetTaxConfigsParams,
): Promise<ApiResponse<TaxConfig[]>> => {
  const response = await axiosInstance.get("/tax-configs", { params });
  return response.data;
};

export const getTaxConfigById = async (
  id: number,
): Promise<ApiResponse<TaxConfig>> => {
  const response = await axiosInstance.get(`/tax-configs/${id}`);
  return response.data;
};

export const createTaxConfig = async (
  data: TaxConfigType,
): Promise<ApiResponse<TaxConfig>> => {
  const response = await axiosInstance.post("/tax-configs", data);
  return response.data;
};

export const updateTaxConfig = async ({
  id,
  data,
}: {
  id: number;
  data: UpdateTaxConfigType;
}): Promise<ApiResponse<TaxConfig>> => {
  const response = await axiosInstance.patch(`/tax-configs/${id}`, data);
  return response.data;
};

export const deleteTaxConfig = async (
  id: number,
): Promise<ApiResponse<{ message: string }>> => {
  const response = await axiosInstance.delete(`/tax-configs/${id}`);
  return response.data;
};

// --- Analytics ---

export const getCostAnalytics = async (): Promise<ApiResponse<CostAnalytics>> => {
  const response = await axiosInstance.get("/cost-analytics");
  return response.data;
};
