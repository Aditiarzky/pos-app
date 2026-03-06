import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createProduct } from "@/services/productService";
import { MutationConfig } from "@/lib/react-query";
import { productKeys } from "./product-query-options";
import { notificationKeys } from "@/hooks/notifications/use-notifications";

type UseCreateProductOptions = {
  mutationConfig?: MutationConfig<typeof createProduct>;
};

export const useCreateProduct = ({
  mutationConfig,
}: UseCreateProductOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
