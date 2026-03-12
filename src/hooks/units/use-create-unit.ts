import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { createUnit } from "@/services/unitService";
import { unitKeys } from "./unit-query-options";

type UseCreateUnitOptions = {
  mutationConfig?: MutationConfig<typeof createUnit>;
};

export const useCreateUnit = ({
  mutationConfig,
}: UseCreateUnitOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUnit,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: unitKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
