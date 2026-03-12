import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { deleteCategory } from "@/services/categoryService";
import { categoryKeys } from "./category-query-options";

type UseDeleteCategoryOptions = {
  mutationConfig?: MutationConfig<typeof deleteCategory>;
};

export const useDeleteCategory = ({
  mutationConfig,
}: UseDeleteCategoryOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteCategory,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: categoryKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
