"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  createUserSchema,
  updateUserSchema,
  type CreateUserInputType,
  type UpdateUserInputType,
} from "@/lib/validations/user";
import { useCreateUser } from "@/hooks/users/use-create-user";
import { useUpdateUser } from "@/hooks/users/use-update-user";
import { UserResponse } from "@/services/userService";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

interface UserFormProps {
  user?: UserResponse | null;
  onSuccess: () => void;
}

export function UserForm({ user, onSuccess }: UserFormProps) {
  const isEdit = !!user;

  const form = useForm<CreateUserInputType | UpdateUserInputType>({
    resolver: zodResolver(isEdit ? updateUserSchema : createUserSchema),
    defaultValues: {
      name: user?.name || "",
      email: user?.email || "",
      password: "",
      role: user?.role || "user",
    },
  });

  const createUser = useCreateUser({
    mutationConfig: {
      onSuccess: () => {
        toast.success("User berhasil dibuat");
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    },
  });

  const updateUser = useUpdateUser({
    mutationConfig: {
      onSuccess: () => {
        toast.success("User berhasil diperbarui");
        onSuccess();
      },
      onError: (err) => toast.error(err.message),
    },
  });

  function onSubmit(values: CreateUserInputType | UpdateUserInputType) {
    if (isEdit && user) {
      updateUser.mutate({ id: user.id, ...values });
    } else {
      createUser.mutate(values as CreateUserInputType);
    }
  }

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Lengkap</FormLabel>
              <FormControl>
                <Input placeholder="John Doe" {...field} />
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
                <Input placeholder="email@example.com" {...field} />
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
                Password{" "}
                {isEdit && (
                  <span className="text-xs text-muted-foreground">
                    (Kosongkan jika tidak diubah)
                  </span>
                )}
              </FormLabel>
              <FormControl>
                <Input type="password" placeholder="******" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="role"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Role</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value || "user"}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih Role" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="flex justify-end gap-3 pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Menyimpan..."
              : isEdit
              ? "Simpan Perubahan"
              : "Tambah User"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
