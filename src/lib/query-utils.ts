import { QueryClient } from "@tanstack/react-query";
import { purchaseKeys } from "@/hooks/purchases/purchase-query-options";
import { productKeys } from "@/hooks/products/product-query-options";
import { dashboardKeys } from "@/hooks/dashboard/dashboard-query-options";
import { reportKeys } from "@/hooks/report/report-query-options";
import { saleKeys } from "@/hooks/sales/sale-query-options";
import { customerKeys } from "@/hooks/master/master-query-options";
import { debtKeys } from "@/hooks/debt/debt-query-options";

export const invalidateBusinessData = (queryClient: QueryClient) => {
  const keys = [
    productKeys.lists(),
    dashboardKeys.all,
    reportKeys.all,
    debtKeys.all,
    customerKeys.lists(),
    saleKeys.lists(),
    purchaseKeys.lists(),
    ["notifications"],
  ];

  keys.forEach((queryKey) => {
    queryClient.invalidateQueries({ queryKey });
  });
};
