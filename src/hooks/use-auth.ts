import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/authService";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authMe,
    retry: false,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  return {
    user: data?.data,
    isLoading,
    isAuthenticated: !!data?.data,
    isError: !!error,
  };
}
