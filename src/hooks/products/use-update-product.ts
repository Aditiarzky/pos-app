import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateProduct } from "@/services/productService";
import { MutationConfig } from "@/lib/react-query";
import { productKeys } from "./product-query-options";

type UseUpdateProductOptions = {
  mutationConfig?: MutationConfig<typeof updateProduct>;
};

export const useUpdateProduct = ({
  mutationConfig,
}: UseUpdateProductOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateProduct,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: productKeys.detail(variables.id),
      });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
