import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPurchases,
  createPurchase,
  updatePurchase,
  deletePurchase,
} from "@/services/purchaseService";

export const usePurchases = (params?: Record<string, any>) => {
  return useQuery({
    queryKey: ["purchases", params],
    queryFn: () => getPurchases(params),
  });
};

export const useCreatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useUpdatePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updatePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};

export const useDeletePurchase = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deletePurchase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["purchases"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
    },
  });
};
