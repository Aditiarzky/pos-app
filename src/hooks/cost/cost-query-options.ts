import { queryOptions } from "@tanstack/react-query";
import {
  getOperationalCosts,
  getOperationalCostById,
  getTaxConfigs,
  getTaxConfigById,
  getCostAnalytics,
  GetOperationalCostsParams,
  GetTaxConfigsParams,
} from "@/services/costService";

// ── Operational Cost Keys ─────────────────────────────────────────────────────

export const operationalCostKeys = {
  all: ["operational-costs"] as const,
  lists: () => [...operationalCostKeys.all, "list"] as const,
  list: (params: GetOperationalCostsParams) =>
    [...operationalCostKeys.lists(), params] as const,
  details: () => [...operationalCostKeys.all, "detail"] as const,
  detail: (id: number) => [...operationalCostKeys.details(), id] as const,
};

export const getOperationalCostsQueryOptions = (
  params: GetOperationalCostsParams = {},
) =>
  queryOptions({
    queryKey: operationalCostKeys.list(params),
    queryFn: () => getOperationalCosts(params),
  });

export const getOperationalCostQueryOptions = (id: number) =>
  queryOptions({
    queryKey: operationalCostKeys.detail(id),
    queryFn: () => getOperationalCostById(id),
    enabled: !!id,
  });

// ── Tax Config Keys ───────────────────────────────────────────────────────────

export const taxConfigKeys = {
  all: ["tax-configs"] as const,
  lists: () => [...taxConfigKeys.all, "list"] as const,
  list: (params: GetTaxConfigsParams) =>
    [...taxConfigKeys.lists(), params] as const,
  details: () => [...taxConfigKeys.all, "detail"] as const,
  detail: (id: number) => [...taxConfigKeys.details(), id] as const,
};

export const getTaxConfigsQueryOptions = (params: GetTaxConfigsParams = {}) =>
  queryOptions({
    queryKey: taxConfigKeys.list(params),
    queryFn: () => getTaxConfigs(params),
  });

export const getTaxConfigQueryOptions = (id: number) =>
  queryOptions({
    queryKey: taxConfigKeys.detail(id),
    queryFn: () => getTaxConfigById(id),
    enabled: !!id,
  });

// --- Cost & Tax Analytics ---

export const costAnalyticsKeys = {
  all: ["cost-analytics"] as const,
  summary: () => [...costAnalyticsKeys.all, "summary"] as const,
};

export const getCostAnalyticsQueryOptions = () =>
  queryOptions({
    queryKey: costAnalyticsKeys.summary(),
    queryFn: () => getCostAnalytics(),
  });
