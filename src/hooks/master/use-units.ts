import { useQuery } from "@tanstack/react-query";
import { getUnits } from "@/services/unitService";

export const useUnits = () => {
  return useQuery({
    queryKey: ["units"],
    queryFn: getUnits,
  });
};
