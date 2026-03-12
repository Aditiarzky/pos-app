import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { restoreUnit } from "@/services/unitService";
import { unitKeys } from "./unit-query-options";

type UseRestoreUnitOptions = {
  mutationConfig?: MutationConfig<typeof restoreUnit>;
};

export const useRestoreUnit = ({
  mutationConfig,
}: UseRestoreUnitOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreUnit,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
