"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createUserSchema,
  updateUserSchema,
  CreateUserInputType,
  UpdateUserInputType,
} from "@/lib/validations/user";
import { ApiResponse, UserResponse } from "@/services/userService";
import { useCreateUser } from "@/hooks/users/use-create-user";
import { useUpdateUser } from "@/hooks/users/use-update-user";
import { AxiosError } from "axios";

interface UserFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userData?: UserResponse | null;
}

export function UserFormModal({
  open,
  onOpenChange,
  userData,
}: UserFormModalProps) {
  const isEditing = !!userData;

  const createUserMutation = useCreateUser();
  const updateUserMutation = useUpdateUser();

  const isPending =
    createUserMutation.isPending || updateUserMutation.isPending;

  const form = useForm<CreateUserInputType | UpdateUserInputType>({
    resolver: zodResolver(isEditing ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      roles: [],
    },
  });

  useEffect(() => {
    if (open) {
      if (userData) {
        form.reset({
          name: userData.name,
          email: userData.email,
          // Roles in userData are objects { role: "..." }, but form expects ["..."]
          roles: userData.roles.map((r) => r.role),
          password: "", // Password always empty on edit
        });
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          roles: [],
        });
      }
    }
  }, [open, userData, form]);

  const onSubmit = async (data: CreateUserInputType | UpdateUserInputType) => {
    try {
      if (isEditing) {
        if (!userData) return;

        // Remove password if empty (it's optional in schema but good to be explicit)
        const updateData = { ...data } as UpdateUserInputType;
        if (!updateData.password) {
          delete updateData.password;
        }

        await updateUserMutation.mutateAsync({
          id: userData.id,
          ...updateData,
        });

        toast.success("User berhasil diperbarui");
      } else {
        await createUserMutation.mutateAsync(data as CreateUserInputType);
        toast.success("User berhasil dibuat");
      }

      onOpenChange(false);
    } catch (error) {
      console.error(error);
      const err = error as AxiosError<ApiResponse>;
      const errorMessage =
        err.response?.data?.error ||
        err.message ||
        "Terjadi kesalahan saat menyimpan user";
      toast.error(errorMessage);
    }
  };

  const roles = ["admin toko", "admin sistem"] as const;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Tambah User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi user di sini."
              : "Tambahkan user baru ke dalam sistem."}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nama Lengkap</FormLabel>
                  <FormControl>
                    <Input placeholder="Nama User" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="email@example.com"
                      type="email"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    {isEditing ? "Password (Opsional)" : "Password"}
                  </FormLabel>
                  <FormControl>
                    <Input
                      placeholder={
                        isEditing
                          ? "Kosongkan jika tidak ingin mengubah"
                          : "Password"
                      }
                      type="password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="roles"
              render={() => (
                <FormItem>
                  <div className="mb-4">
                    <FormLabel className="text-base">Role</FormLabel>
                    <DialogDescription>
                      Pilih role yang dimiliki user.
                    </DialogDescription>
                  </div>
                  {roles.map((role) => (
                    <FormField
                      key={role}
                      control={form.control}
                      name="roles"
                      render={({ field }) => {
                        return (
                          <FormItem
                            key={role}
                            className="flex flex-row items-start space-x-3 space-y-0"
                          >
                            <FormControl>
                              <Checkbox
                                checked={field.value?.includes(role)}
                                onCheckedChange={(checked) => {
                                  return checked
                                    ? field.onChange([
                                        ...(field.value || []),
                                        role,
                                      ])
                                    : field.onChange(
                                        field.value?.filter(
                                          (value) => value !== role,
                                        ),
                                      );
                                }}
                              />
                            </FormControl>
                            <FormLabel className="font-normal capitalize">
                              {role}
                            </FormLabel>
                          </FormItem>
                        );
                      }}
                    />
                  ))}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="secondary"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Simpan
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
