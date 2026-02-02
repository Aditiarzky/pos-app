import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getCategories, createCategory } from "@/services/categoryService";
import { ApiResponse } from "@/services/productService";

export const useCategories = () => {
  return useQuery({
    queryKey: ["categories"],
    queryFn: getCategories,
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["categories"] });
    },
    onError: (error: ApiResponse) => {
      const errorMessage = error.error || "Gagal membuat baru";
      throw new Error(errorMessage);
    },
  });
};
