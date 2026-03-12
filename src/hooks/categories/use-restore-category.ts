import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { restoreCategory } from "@/services/categoryService";
import { categoryKeys } from "./category-query-options";

type UseRestoreCategoryOptions = {
  mutationConfig?: MutationConfig<typeof restoreCategory>;
};

export const useRestoreCategory = ({
  mutationConfig,
}: UseRestoreCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreCategory,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
