import { queryOptions } from "@tanstack/react-query";
import {
  getCategories,
  GetCategoriesParams,
} from "@/services/categoryService";

export const categoryKeys = {
  all: ["categories"] as const,
  lists: () => [...categoryKeys.all, "list"] as const,
  list: (params?: GetCategoriesParams) =>
    [...categoryKeys.lists(), { ...params }] as const,
};

export const getCategoriesQueryOptions = (params?: GetCategoriesParams) => {
  return queryOptions({
    queryKey: categoryKeys.list(params),
    queryFn: () => getCategories(params),
  });
};
