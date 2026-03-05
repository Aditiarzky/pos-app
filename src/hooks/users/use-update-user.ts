import { useMutation, useQueryClient } from "@tanstack/react-query";
import { updateUser } from "../../services/userService";
import { MutationConfig } from "@/lib/react-query";
import { userKeys } from "./user-query-options";

type UseUpdateUserOptions = {
  mutationConfig?: MutationConfig<typeof updateUser>;
};

export const useUpdateUser = ({
  mutationConfig,
}: UseUpdateUserOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(variables.id),
      });
      queryClient.invalidateQueries({ queryKey: userKeys.current });
      queryClient.invalidateQueries({ queryKey: ["auth-me"] });

      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
