import { useMutation, useQueryClient } from "@tanstack/react-query";
import { MutationConfig } from "@/lib/react-query";
import { invalidateBusinessData } from "@/lib/query-utils";
import { bulkForceDelete, forceDeleteTrash } from "@/services/trashService";
import { trashKeys } from "./trash-query-options";

type UseForceDeleteTrashOptions = {
  mutationConfig?: MutationConfig<typeof forceDeleteTrash>;
};

type UseBulkForceDeleteTrashOptions = {
  mutationConfig?: MutationConfig<typeof bulkForceDelete>;
};

export const useForceDeleteTrash = ({
  mutationConfig,
}: UseForceDeleteTrashOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: forceDeleteTrash,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      invalidateBusinessData(queryClient);
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useBulkForceDeleteTrash = ({
  mutationConfig,
}: UseBulkForceDeleteTrashOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: bulkForceDelete,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: trashKeys.lists() });
      invalidateBusinessData(queryClient);
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
