import { queryOptions, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { MutationConfig, QueryConfig } from "@/lib/react-query";
import {
  clearReadNotifications,
  getNotifications,
  markNotificationAsRead,
  markNotificationsAsRead,
} from "@/services/notificationService";

export const notificationKeys = {
  all: ["notifications"] as const,
  lists: () => [...notificationKeys.all, "list"] as const,
  list: (params?: { limit?: number }) =>
    [...notificationKeys.lists(), { ...params }] as const,
};

export const getNotificationsQueryOptions = (params?: { limit?: number }) =>
  queryOptions({
    queryKey: notificationKeys.list(params),
    queryFn: () => getNotifications(params),
    refetchInterval: 60000,
    refetchOnWindowFocus: true,
  });

type UseNotificationsOptions = {
  params?: { limit?: number };
  queryConfig?: QueryConfig<typeof getNotificationsQueryOptions>;
};

export const useNotifications = ({
  params,
  queryConfig,
}: UseNotificationsOptions = {}) => {
  return useQuery({
    ...getNotificationsQueryOptions(params),
    ...queryConfig,
  });
};

type UseMarkNotificationAsReadOptions = {
  mutationConfig?: MutationConfig<typeof markNotificationAsRead>;
};

export const useMarkNotificationAsRead = ({
  mutationConfig,
}: UseMarkNotificationAsReadOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationAsRead,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

type UseMarkNotificationsAsReadOptions = {
  mutationConfig?: MutationConfig<typeof markNotificationsAsRead>;
};

export const useMarkNotificationsAsRead = ({
  mutationConfig,
}: UseMarkNotificationsAsReadOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: markNotificationsAsRead,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};

type UseClearReadNotificationsOptions = {
  mutationConfig?: MutationConfig<typeof clearReadNotifications>;
};

export const useClearReadNotifications = ({
  mutationConfig,
}: UseClearReadNotificationsOptions = {}) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: clearReadNotifications,
    ...mutationConfig,
    onSuccess: (data, variables, onMutateResult, context) => {
      queryClient.invalidateQueries({ queryKey: notificationKeys.all });
      mutationConfig?.onSuccess?.(data, variables, onMutateResult, context);
    },
  });
};
