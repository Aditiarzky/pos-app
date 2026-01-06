import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createUser } from "../../services/userService";
import { MutationConfig } from "@/lib/react-query";
import { userKeys } from "./user-query-options";

type UseCreateUserOptions = {
  mutationConfig?: MutationConfig<typeof createUser>;
};

export const useCreateUser = ({
  mutationConfig,
}: UseCreateUserOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
