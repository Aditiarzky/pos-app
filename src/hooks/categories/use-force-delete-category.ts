import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { forceDeleteCategory } from "@/services/categoryService";
import { categoryKeys } from "./category-query-options";

type UseForceDeleteCategoryOptions = {
  mutationConfig?: MutationConfig<typeof forceDeleteCategory>;
};

export const useForceDeleteCategory = ({
  mutationConfig,
}: UseForceDeleteCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteCategory,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
