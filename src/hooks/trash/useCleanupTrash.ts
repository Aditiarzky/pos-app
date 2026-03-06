import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { cleanupExpiredTrash } from "@/services/trashService";
import { trashKeys } from "./trash-query-options";
import { notificationKeys } from "@/hooks/notifications/use-notifications";

type UseCleanupTrashOptions = {
  mutationConfig?: MutationConfig<typeof cleanupExpiredTrash>;
};

export const useCleanupTrash = ({ mutationConfig }: UseCleanupTrashOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: cleanupExpiredTrash,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
