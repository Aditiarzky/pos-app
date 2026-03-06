import { useMutation, useQueryClient } from "@tanstack/react-query";
import { changePassword } from "@/services/userService";
import { MutationConfig } from "@/lib/react-query";
import { userKeys } from "./user-query-options";

type UseChangePasswordOptions = {
  mutationConfig?: MutationConfig<typeof changePassword>;
};

export const useChangePassword = ({
  mutationConfig,
}: UseChangePasswordOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: changePassword,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: userKeys.current });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
