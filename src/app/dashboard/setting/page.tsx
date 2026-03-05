"use client";

import { Suspense } from "react";
import { Loader2, Settings } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { AccountSettingCard } from "./_components/account-setting-card";
import { StoreSettingCard } from "./_components/store-setting-card";
import { UserResponse } from "@/services/userService";

function SettingContent() {
  const { user, roles } = useAuth();

  const isSystemAdmin = (roles as string[]).includes("admin sistem");

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <span className="w-2 bg-primary" />
          <div className="flex flex-col">
            <h1 className="text-2xl text-primary font-geist font-semibold truncate">
              Settings
            </h1>
            <p className="text-sm text-muted-foreground">
              Atur akun user dan informasi store
            </p>
          </div>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Setting Akun User</h2>
          </div>
          {user && typeof user.id === 'number' && (
            <AccountSettingCard user={user as UserResponse} />
          )}
        </section>

        {isSystemAdmin && (
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-lg font-semibold">Setting Store Information</h2>
            </div>
            <StoreSettingCard />
          </section>
        )}
      </main>
    </>
  );
}

export default function SettingPage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <SettingContent />
    </Suspense>
  );
}
