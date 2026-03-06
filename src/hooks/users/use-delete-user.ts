import { useMutation, useQueryClient } from "@tanstack/react-query";
import { deleteUser } from "../../services/userService";
import { MutationConfig } from "@/lib/react-query";
import { userKeys } from "./user-query-options";

type UseDeleteUserOptions = {
  mutationConfig?: MutationConfig<typeof deleteUser>;
};

export const useDeleteUser = ({ mutationConfig }: UseDeleteUserOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: deleteUser,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: userKeys.lists() });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};