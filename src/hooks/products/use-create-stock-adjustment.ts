import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createStockAdjustment } from "@/services/productService";
import { MutationConfig } from "@/lib/react-query";
import { productKeys } from "./product-query-options";
import { toast } from "sonner";

type UseCreateStockAdjustmentOptions = {
  mutationConfig?: MutationConfig<typeof createStockAdjustment>;
};

export const useCreateStockAdjustment = ({
  mutationConfig,
}: UseCreateStockAdjustmentOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createStockAdjustment,
    onSuccess: (data, variables, context, onMutateResult) => {
      queryClient.invalidateQueries({ queryKey: productKeys.all });
      toast.success("Stok berhasil disesuaikan");
      mutationConfig?.onSuccess?.(data, variables, context, onMutateResult);
    },
  });
};
