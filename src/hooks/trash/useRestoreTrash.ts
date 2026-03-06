import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { invalidateBusinessData } from "@/lib/query-utils";
import { bulkRestore, restoreTrash } from "@/services/trashService";
import { trashKeys } from "./trash-query-options";

type UseRestoreTrashOptions = {
  mutationConfig?: MutationConfig<typeof restoreTrash>;
};

type UseBulkRestoreTrashOptions = {
  mutationConfig?: MutationConfig<typeof bulkRestore>;
};

export const useRestoreTrash = ({
  mutationConfig,
}: UseRestoreTrashOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: restoreTrash,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      invalidateBusinessData(queryClient);
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useBulkRestoreTrash = ({
  mutationConfig,
}: UseBulkRestoreTrashOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkRestore,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      invalidateBusinessData(queryClient);
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
