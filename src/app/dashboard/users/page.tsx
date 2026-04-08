"use client";

import { useState, Suspense } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListSection } from "./_components/user-list-section";
import { UserFormModal } from "./_components/user-form-modal";
import { UserAnalytics, UserResponse } from "@/services/userService";
import { RoleGuard } from "@/components/role-guard";
import { AccessDenied } from "@/components/access-denied";
import { useUsers } from "@/hooks/users/use-users";
import { CardBg } from "@/assets/card-background/card-bg";
import { AnimatedNumber } from "@/components/ui/animated-number";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StickyCardStack } from "@/components/ui/sticky-card-wrapper";
import { ShieldCheck, UserCog } from "lucide-react";

function AnalyticsCards({ analytics }: { analytics?: UserAnalytics }) {
  return (
    <StickyCardStack className="animate-in fade-in slide-in-from-top-4 duration-500">
      {/* Total User */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Total User
            <div className="p-2 bg-primary/10 rounded-lg">
              <Users className="h-4 w-4 text-primary" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold">
            <AnimatedNumber value={analytics?.totalUsers ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Pengguna aktif terdaftar
          </p>
        </CardContent>
      </Card>

      {/* Admin Toko */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Admin Toko
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <UserCog className="h-4 w-4 text-rose-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold">
            <AnimatedNumber value={analytics?.adminToko ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Operator operasional toko
          </p>
        </CardContent>
      </Card>

      {/* Admin Sistem */}
      <Card className="relative overflow-hidden border-none shadow-md">
        <CardBg />
        <CardHeader className="pb-2 z-10">
          <CardTitle className="text-sm font-medium flex items-center justify-between text-muted-foreground">
            Admin Sistem
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <ShieldCheck className="h-4 w-4 text-emerald-500" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="z-10 pt-0 text-primary">
          <div className="text-2xl font-bold">
            <AnimatedNumber value={analytics?.adminSistem ?? 0} />
          </div>
          <p className="text-[10px] text-muted-foreground mt-1 font-medium italic opacity-60">
            Akses kontrol penuh sistem
          </p>
        </CardContent>
      </Card>
    </StickyCardStack>
  );
}

function UsersContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);
  const { data } = useUsers();
  const analytics = data?.analytics;

  const handleCreateNew = () => {
    setEditingUser(null);
    setIsFormOpen(true);
  };

  const handleEdit = (user: UserResponse) => {
    setEditingUser(user);
    setIsFormOpen(true);
  };

  return (
    <>
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 sm:px-6 justify-between w-full items-center gap-4 pb-16">
        <div className="flex items-center gap-4">
          <div className="h-12 w-1.5 bg-primary rounded-full shadow-[0_0_15px_rgba(var(--primary),0.5)]" />
          <div className="flex flex-col">
            <h1 className="text-3xl text-primary font-bold tracking-tight">
              User & Akses
            </h1>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-widest opacity-80">
              Kontrol Pengguna • Izin & Keamanan
            </p>
          </div>
        </div>
        <div>
          <Button
            onClick={handleCreateNew}
            className="bg-gradient-to-br from-primary to-green-600 dark:to-green-400 hover:brightness-90 rounded-xl"
          >
            <Plus className="mr-0 sm:mr-2 h-4 w-4" />
            <p className="hidden sm:block">Tambah User</p>
          </Button>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <AnalyticsCards analytics={analytics} />

        <div className="pt-4">
          <div className="flex items-center gap-2 mb-6">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Users className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
          </div>

          <UserListSection onEdit={handleEdit} />
        </div>

        {/*{isAdminSystem && (
          <div className="space-y-4">
            <div className="flex items-start gap-2 mb-4">
              <KeyRound className="h-5 w-5 mt-1 text-primary" />
              <div>
                <h2 className="text-lg font-semibold">
                  Permintaan Reset Password
                </h2>
                <p className="text-sm text-muted-foreground">
                  Reset akan mengubah password menjadi default "Password123".
                </p>
              </div>
            </div>

            <PasswordResetRequestsSection />
          </div>
        )}*/}

        <UserFormModal
          open={isFormOpen}
          onOpenChange={(open) => {
            setIsFormOpen(open);
            if (!open) setEditingUser(null);
          }}
          userData={editingUser}
        />
      </main>
    </>
  );
}

export default function UsersPage() {
  return (
    <RoleGuard allowedRoles={["admin sistem"]} fallback={<AccessDenied />}>
      <Suspense
        fallback={
          <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }
      >
        <UsersContent />
      </Suspense>
    </RoleGuard>
  );
}
