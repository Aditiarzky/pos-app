import { useQuery } from "@tanstack/react-query";
import { authMe } from "@/services/authService";

export function useAuth() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  return {
    user: data?.data,
    roles: data?.data?.roles?.map((r) => r.role) || [],
    isLoading,
    isAuthenticated: !!data?.data,
    isError: !!error,
  };
}
