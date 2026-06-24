// [REMOVED: product audit feature] — entire hook commented out
// Uncomment to restore or delete permanently

// import { useQuery } from "@tanstack/react-query";
// import { getProductAuditLogs } from "@/services/productService";

// export const useProductAuditLogs = ({
//   params,
// }: {
//   params?: {
//     page?: number;
//     limit?: number;
//     search?: string;
//     action?: string;
//     dateFrom?: string;
//     dateTo?: string;
//   };
// } = {}) => {
//   return useQuery({
//     queryKey: ["product-audit-logs", params],
//     queryFn: () => getProductAuditLogs(params),
//   });
// };
