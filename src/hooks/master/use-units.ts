import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { getUnits, createUnit } from "@/services/unitService";

export const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
  });
};

export const useCreateUnit = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUnit,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["units"] });
    },
  });
};
