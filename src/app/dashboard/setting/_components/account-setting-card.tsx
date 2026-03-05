"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Loader2, Lock, Pencil, ShieldCheck, UserCog } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useUpdateUser } from "@/hooks/users/use-update-user";
import { useChangePassword } from "@/hooks/users/use-change-password";
import { ChangePasswordInputType, changePasswordSchema } from "@/lib/validations/user";
import { ApiResponse, UserResponse } from "@/services/userService";

const profileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.string().email("Email tidak valid"),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

type AccountSettingCardProps = {
  user: UserResponse | undefined;
};

type FormMode = "profile" | "password";

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as AxiosError<ApiResponse>;
  return err.response?.data?.error || err.message || fallback;
};

export function AccountSettingCard({ user }: AccountSettingCardProps) {
  const [activeView, setActiveView] = useState<"preview" | "form">("preview");
  const [formMode, setFormMode] = useState<FormMode>("profile");

  const updateUserMutation = useUpdateUser();
  const changePasswordMutation = useChangePassword();

  const isPending = updateUserMutation.isPending || changePasswordMutation.isPending;

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: "",
      email: "",
    },
  });

  const passwordForm = useForm<ChangePasswordInputType>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  useEffect(() => {
    if (!user) return;

    profileForm.reset({
      name: user.name,
      email: user.email,
    });
  }, [user, profileForm]);

  const joinedRoles = useMemo(
    () => user?.roles?.map((role) => role.role) ?? [],
    [user?.roles],
  );

  const handleEditProfile = () => {
    setFormMode("profile");
    setActiveView("form");
  };

  const handleEditPassword = () => {
    setFormMode("password");
    setActiveView("form");
  };

  const handleCancelForm = () => {
    setActiveView("preview");
    setFormMode("profile");
    passwordForm.reset();
    if (user) {
      profileForm.reset({
        name: user.name,
        email: user.email,
      });
    }
  };

  const onSubmitProfile = async (values: ProfileFormValues) => {
    if (!user?.id) {
      toast.error("User tidak ditemukan");
      return;
    }

    try {
      await updateUserMutation.mutateAsync({
        id: user.id,
        name: values.name,
        email: values.email,
      });
      toast.success("Informasi akun berhasil diperbarui");
      setActiveView("preview");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui akun"));
    }
  };

  const onSubmitPassword = async (values: ChangePasswordInputType) => {
    try {
      await changePasswordMutation.mutateAsync(values);
      toast.success("Password berhasil diperbarui");
      passwordForm.reset();
      setActiveView("preview");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui password"));
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            Setting Akun User
          </CardTitle>
          <CardDescription>
            Kelola informasi akun dan keamanan login Anda.
          </CardDescription>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditPassword}
          >
            <Lock className="h-4 w-4 mr-1" />
            Ganti Password
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "preview" | "form")}
          className="space-y-4"
        >
          <TabsContent value="preview" className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Nama</p>
                <p className="font-medium">{user?.name || "-"}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Email</p>
                <p className="font-medium">{user?.email || "-"}</p>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-xs text-muted-foreground">Role</p>
              <div className="flex flex-wrap gap-2">
                {joinedRoles.length > 0 ? (
                  joinedRoles.map((role) => (
                    <Badge key={role} variant="secondary" className="capitalize">
                      <ShieldCheck className="h-3.5 w-3.5 mr-1" />
                      {role}
                    </Badge>
                  ))
                ) : (
                  <p className="text-sm font-medium">-</p>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="form">
            {formMode === "profile" ? (
              <Form {...profileForm}>
                <form
                  onSubmit={profileForm.handleSubmit(onSubmitProfile)}
                  className="space-y-4"
                >
                  <FormField
                    control={profileForm.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nama</FormLabel>
                        <FormControl>
                          <Input placeholder="Nama lengkap" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={profileForm.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Email</FormLabel>
                        <FormControl>
                          <Input placeholder="email@contoh.com" type="email" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelForm}
                      disabled={isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Simpan Perubahan
                    </Button>
                  </div>
                </form>
              </Form>
            ) : (
              <Form {...passwordForm}>
                <form
                  onSubmit={passwordForm.handleSubmit(onSubmitPassword)}
                  className="space-y-4"
                >
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Saat Ini</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Password Baru</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Konfirmasi Password Baru</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleCancelForm}
                      disabled={isPending}
                    >
                      Batal
                    </Button>
                    <Button type="submit" disabled={isPending}>
                      {isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                      Simpan Password
                    </Button>
                  </div>
                </form>
              </Form>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
