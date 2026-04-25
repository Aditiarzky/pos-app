import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "@/lib/axios";
import { ApiResponse } from "@/services/productService";

export type TrashSettings = {
  id: number;
  lastCleanupAt: string | null;
  cleanupIntervalMinutes: number;
  updatedAt: string;
};

export const useTrashSettings = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["trash-settings"],
    queryFn: async () => {
      const response = await axiosInstance.get<ApiResponse<TrashSettings>>(
        "/trash/settings",
      );
      return response.data;
    },
  });

  const mutation = useMutation({
    mutationFn: async (minutes: number) => {
      const response = await axiosInstance.patch<ApiResponse<TrashSettings>>(
        "/trash/settings",
        { cleanupIntervalMinutes: minutes },
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trash-settings"] });
    },
  });

  return {
    settings: query.data?.data,
    isLoading: query.isLoading,
    isError: query.isError,
    updateInterval: mutation.mutate,
    isUpdating: mutation.isPending,
  };
};
