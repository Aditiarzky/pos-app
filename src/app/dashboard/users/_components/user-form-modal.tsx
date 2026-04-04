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
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ShieldCheck, UserCog } from "lucide-react";
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
      role: undefined,
    },
  });

  useEffect(() => {
    if (open) {
      if (userData) {
        form.reset({
          name: userData.name,
          email: userData.email,
          // Roles in userData are objects { role: "..." }, but form expects a string
          role: userData.roles[0]?.role,
          password: "", // Password always empty on edit
        });
      } else {
        form.reset({
          name: "",
          email: "",
          password: "",
          role: undefined,
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
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
              name="role"
              render={({ field }) => (
                <FormItem className="space-y-3 pt-2">
                  <div className="mb-4">
                    <FormLabel className="text-base text-foreground font-semibold">
                      Role Akses
                    </FormLabel>
                    <DialogDescription>
                      Pilih satu role untuk menentukan hak akses user.
                    </DialogDescription>
                  </div>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      value={field.value || ""}
                      className="grid grid-cols-2 gap-4"
                    >
                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="admin toko"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                          <UserCog className="mb-3 h-8 w-8 text-rose-500" />
                          <div className="space-y-1 text-center">
                            <span className="font-semibold text-sm">Admin Toko</span>
                            <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                              Fokus operasional toko
                            </p>
                          </div>
                        </FormLabel>
                      </FormItem>

                      <FormItem>
                        <FormControl>
                          <RadioGroupItem
                            value="admin sistem"
                            className="peer sr-only"
                          />
                        </FormControl>
                        <FormLabel className="flex flex-col items-center justify-between rounded-xl border-2 border-muted bg-transparent p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 [&:has([data-state=checked])]:border-primary cursor-pointer transition-all">
                          <ShieldCheck className="mb-3 h-8 w-8 text-emerald-500" />
                          <div className="space-y-1 text-center">
                            <span className="font-semibold text-sm">Admin Sistem</span>
                            <p className="text-[11px] text-muted-foreground font-normal leading-tight">
                              Akses penuh sistem
                            </p>
                          </div>
                        </FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                className="rounded-xl"
                onClick={() => onOpenChange(false)}
                disabled={isPending}
              >
                Batal
              </Button>
              <Button type="submit" className="rounded-xl shadow-md" disabled={isPending}>
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
