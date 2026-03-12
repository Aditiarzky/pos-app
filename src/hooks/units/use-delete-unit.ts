import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { deleteUnit } from "@/services/unitService";
import { unitKeys } from "./unit-query-options";

type UseDeleteUnitOptions = {
  mutationConfig?: MutationConfig<typeof deleteUnit>;
};

export const useDeleteUnit = ({
  mutationConfig,
}: UseDeleteUnitOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUnit,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
