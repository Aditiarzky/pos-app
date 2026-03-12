import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { forceDeleteUnit } from "@/services/unitService";
import { unitKeys } from "./unit-query-options";

type UseForceDeleteUnitOptions = {
  mutationConfig?: MutationConfig<typeof forceDeleteUnit>;
};

export const useForceDeleteUnit = ({
  mutationConfig,
}: UseForceDeleteUnitOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteUnit,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
