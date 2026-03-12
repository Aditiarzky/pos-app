import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { updateCategory } from "@/services/categoryService";
import { categoryKeys } from "./category-query-options";

type UseUpdateCategoryOptions = {
  mutationConfig?: MutationConfig<typeof updateCategory>;
};

export const useUpdateCategory = ({
  mutationConfig,
}: UseUpdateCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateCategory,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
