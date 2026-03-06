import { queryOptions } from "@tanstack/react-query";
import { getStoreSetting } from "@/services/storeSettingService";

export const settingKeys = {
  all: ["settings"] as const,
  detail: () => [...settingKeys.all, "detail"] as const,
};

export const getSettingQueryOptions = () => {
  return queryOptions({
    queryKey: settingKeys.detail(),
    queryFn: () => getStoreSetting(),
  });
};
