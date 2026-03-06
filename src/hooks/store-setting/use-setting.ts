import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationConfig, QueryConfig } from "@/lib/react-query";
import { updateStoreSetting } from "@/services/storeSettingService";
import { getSettingQueryOptions, settingKeys } from "./setting-query-options";

type UseUpdateSettingOptions = {
  mutationConfig?: MutationConfig<typeof updateStoreSetting>;
};

type UseSettingOption = {
  queryConfig?: QueryConfig<typeof getSettingQueryOptions>;
};

export const useUpdateStoreSetting = ({
  mutationConfig,
}: UseUpdateSettingOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateStoreSetting,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: settingKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

export const useGetStoreSetting = ({ queryConfig }: UseSettingOption = {}) => {
  return useQuery({
    ...getSettingQueryOptions(),
    ...queryConfig,
  });
};
