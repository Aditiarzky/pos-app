"use client";

import { useState, Suspense } from "react";
import { Plus, Users, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserListSection } from "./_components/user-list-section";
import { UserFormModal } from "./_components/user-form-modal";
import { UserResponse } from "@/services/userService";
import { IconShieldLock } from "@tabler/icons-react";

function UsersContent() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserResponse | null>(null);

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
      <header className="sticky top-6 mx-auto container z-10 flex flex-row px-4 justify-between w-full items-center gap-4 pb-16">
        <div className="overflow-hidden flex gap-2">
          <IconShieldLock className="h-8 w-8 text-primary" />
          <h1 className="text-2xl text-primary font-geist font-semibold truncate">
            User & Akses
          </h1>
        </div>
        <div>
          <Button onClick={handleCreateNew}>
            <Plus className="mr-0 sm:mr-2 h-4 w-4" />
            <p className="hidden sm:block">Tambah User</p>
          </Button>
        </div>
      </header>

      <main className="relative z-10 -mt-12 container bg-background shadow-[0_-3px_5px_-1px_rgba(0,0,0,0.1)] rounded-t-4xl mx-auto p-4 space-y-6 min-h-screen border-t">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Users className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Daftar Pengguna</h2>
          </div>

          <UserListSection onEdit={handleEdit} />
        </div>

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
    <Suspense
      fallback={
        <div className="container mx-auto p-4 flex items-center justify-center min-h-[400px]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <UsersContent />
    </Suspense>
  );
}
