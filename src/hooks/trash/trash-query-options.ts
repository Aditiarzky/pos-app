import { queryOptions } from "@tanstack/react-query";
import { fetchTrash, FetchTrashParams } from "@/services/trashService";

export const trashKeys = {
  all: ["trash"] as const,
  lists: () => [...trashKeys.all, "list"] as const,
  list: (params?: FetchTrashParams) => [...trashKeys.lists(), { ...params }] as const,
};

export const getTrashQueryOptions = (params?: FetchTrashParams) => {
  return queryOptions({
    queryKey: trashKeys.list(params),
    queryFn: () => fetchTrash(params),
  });
};
