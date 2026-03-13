import { useMutation, useQueryClient } from "@tanstack/react-query";
import { resolvePasswordResetRequest } from "@/services/passwordResetService";
import { MutationConfig } from "@/lib/react-query";
import { passwordResetKeys } from "./password-reset-query-options";

type UseResolvePasswordResetOptions = {
  mutationConfig?: MutationConfig<typeof resolvePasswordResetRequest>;
};

export const useResolvePasswordReset = (
  { mutationConfig }: UseResolvePasswordResetOptions = {},
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: resolvePasswordResetRequest,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: passwordResetKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
