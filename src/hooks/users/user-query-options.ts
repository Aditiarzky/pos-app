import { queryOptions } from "@tanstack/react-query";
import { getUsers, getUser, getCurrentUser } from "../../services/userService";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (params?: Record<string, unknown>) => [...userKeys.lists(), { ...params }] as const,
  details: () => [...userKeys.all, "detail"] as const,
  detail: (id: number) => [...userKeys.details(), id] as const,
  current: ["current-user"] as const,
};

export const getUsersQueryOptions = (params?: Record<string, unknown>) => {
  return queryOptions({
    queryKey: userKeys.list(params),
    queryFn: () => getUsers(params),
  });
};

export const getUserDetailQueryOptions = (id: number) => {
  return queryOptions({
    queryKey: userKeys.detail(id),
    queryFn: () => getUser(id),
    enabled: !!id,
  });
};

export const getCurrentUserQueryOptions = () => {
  return queryOptions({
    queryKey: userKeys.current,
    queryFn: getCurrentUser,
    retry: false,
  });
};