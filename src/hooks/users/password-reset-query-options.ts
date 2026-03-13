import { queryOptions } from "@tanstack/react-query";
import { getPasswordResetRequests } from "@/services/passwordResetService";

export const passwordResetKeys = {
  all: ["password-reset-requests"] as const,
  lists: () => [...passwordResetKeys.all, "list"] as const,
};

export const getPasswordResetRequestsQueryOptions = () => {
  return queryOptions({
    queryKey: passwordResetKeys.lists(),
    queryFn: getPasswordResetRequests,
  });
};
