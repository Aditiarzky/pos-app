import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authMe, authLogout } from "@/services/authService";
import { useRouter } from "next/navigation";

export function useAuth() {
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data, isLoading, error } = useQuery({
    queryKey: ["auth-me"],
    queryFn: authMe,
    retry: false,
    staleTime: 1000 * 60 * 5,
  });

  const logoutMutation = useMutation({
    mutationFn: authLogout,
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["auth-me"] });
      router.push("/login");
    },
  });

  return {
    user: data?.data,
    roles: data?.data?.roles?.map((r) => r.role) || [],
    isLoading,
    isAuthenticated: !!data?.data,
    isError: !!error,
    logout: logoutMutation.mutate,
    isLoggingOut: logoutMutation.isPending,
  };
}
