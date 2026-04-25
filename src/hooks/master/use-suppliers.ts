import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  SupplierQueryParams,
} from "@/services/supplierService";

export const useSuppliers = (params?: SupplierQueryParams) => {
  return useQuery({
    queryKey: ["suppliers", params],
    queryFn: () => getSuppliers(params),
  });
};

export const useCreateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useUpdateSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};

export const useDeleteSupplier = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteSupplier,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["suppliers"] });
    },
  });
};
