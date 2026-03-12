import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { GetCategoriesParams } from "@/services/categoryService";
import { getCategoriesQueryOptions } from "./category-query-options";

type UseCategoriesOptions = {
  params?: GetCategoriesParams;
  queryConfig?: QueryConfig<typeof getCategoriesQueryOptions>;
};

export const useCategories = ({
  params,
  queryConfig,
}: UseCategoriesOptions = {}) => {
  return useQuery({
    ...getCategoriesQueryOptions(params),
    ...queryConfig,
  });
};
