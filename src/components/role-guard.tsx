"use client";

import { useAuth } from "@/hooks/use-auth";
import { ReactNode } from "react";
import { redirect } from "next/navigation";
import LogoNav from "@/assets/logo-nav/logo-nav";

interface RoleGuardProps {
  children: ReactNode;
  allowedRoles: Array<"admin toko" | "admin sistem">;
  fallback?: ReactNode;
  redirectTo?: string;
}

export function RoleGuard({
  children,
  allowedRoles,
  fallback = null,
  redirectTo,
}: RoleGuardProps) {
  const { roles, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-8">
        <LogoNav type="nav" height={24} />
      </div>
    );
  }

  if (!isAuthenticated) {
    if (redirectTo) redirect(redirectTo);
    return fallback;
  }

  const hasAccess = allowedRoles.some((role) =>
    (roles as string[]).includes(role),
  );

  if (!hasAccess) {
    if (redirectTo) redirect(redirectTo);
    return fallback;
  }

  return <>{children}</>;
}
