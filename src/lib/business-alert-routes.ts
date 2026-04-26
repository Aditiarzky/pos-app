import {
  DashboardLowStockAlert,
  DashboardUnpaidDebtAlert,
} from "@/services/dashboardService";

export const buildLowStockAlertHref = (item: DashboardLowStockAlert) => {
  const query = encodeURIComponent(item.productName || "");
  return `/dashboard/products${query ? `?q=${query}` : ""}`;
};

export const buildUnpaidDebtAlertHref = (item: DashboardUnpaidDebtAlert) => {
  const invoiceQuery = encodeURIComponent(item.invoiceNumber || "");
  return `/dashboard/sales?tab=history-sales${invoiceQuery ? `&q=${invoiceQuery}` : ""}`;
};
