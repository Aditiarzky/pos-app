import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { updateUnit } from "@/services/unitService";
import { unitKeys } from "./unit-query-options";

type UseUpdateUnitOptions = {
  mutationConfig?: MutationConfig<typeof updateUnit>;
};

export const useUpdateUnit = ({
  mutationConfig,
}: UseUpdateUnitOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUnit,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
