import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { createCategory } from "@/services/categoryService";
import { categoryKeys } from "./category-query-options";

type UseCreateCategoryOptions = {
  mutationConfig?: MutationConfig<typeof createCategory>;
};

export const useCreateCategory = ({
  mutationConfig,
}: UseCreateCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
