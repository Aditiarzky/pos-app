import { useQuery } from "@tanstack/react-query";
import { QueryConfig } from "@/lib/react-query";
import { FetchTrashParams } from "@/services/trashService";
import { getTrashQueryOptions } from "./trash-query-options";

type UseTrashOptions = {
  params?: FetchTrashParams;
  queryConfig?: QueryConfig<typeof getTrashQueryOptions>;
};

export const useTrash = ({ params, queryConfig }: UseTrashOptions = {}) => {
  return useQuery({
    ...getTrashQueryOptions(params),
    ...queryConfig,
  });
};
