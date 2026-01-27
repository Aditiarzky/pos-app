"use client";

import { AppLayout } from "@/components/app-layout";
import React from "react";
import { RoleGuard } from "@/components/role-guard";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <RoleGuard
      allowedRoles={["admin toko", "admin sistem"]}
      redirectTo="/login"
    >
      <AppLayout>
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              {children}
            </div>
          </div>
        </div>
      </AppLayout>
    </RoleGuard>
  );
}
