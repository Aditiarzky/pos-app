"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { Eye, Loader2, Lock, Mail, MoreVertical, Pencil, ShieldCheck, UserCog } from "lucide-react";
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
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useUpdateUser } from "@/hooks/users/use-update-user";
import { useChangePassword } from "@/hooks/users/use-change-password";
import { ChangePasswordInputType, changePasswordSchema } from "@/lib/validations/user";
import { ApiResponse, UserResponse } from "@/services/userService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const profileSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  email: z.email("Email tidak valid"),
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

// Helper untuk mengambil inisial nama
const getInitials = (name?: string) => {
  if (!name) return "??";
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }
  return parts[0][0].toUpperCase();
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
    <Card className="border shadow-sm gap-0 p-0 overflow-hidden">
      <CardHeader className="flex flex-row pt-4 items-start justify-between gap-3 border-b bg-muted/30">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCog className="h-4 w-4 text-primary" />
            Setting Akun User
          </CardTitle>
          <CardDescription>
            Kelola informasi akun dan keamanan login Anda.
          </CardDescription>
        </div>

        <div className="hidden md:flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCancelForm}
            disabled={activeView === "preview"}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditProfile}
            disabled={activeView === "form" && formMode === "profile"}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit Profil
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEditPassword}
            disabled={activeView === "form" && formMode === "password"}
          >
            <Lock className="h-4 w-4 mr-1" />
            Ganti Password
          </Button>
        </div>
        <div className="md:hidden">
          <Popover>
            <PopoverTrigger>
              <MoreVertical className="h-4 w-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-fit flex p-2 flex-col items-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleCancelForm}
                disabled={activeView === "preview"}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEditProfile}
                disabled={activeView === "form" && formMode === "profile"}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit Profil
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={handleEditPassword}
                disabled={activeView === "form" && formMode === "password"}
              >
                <Lock className="h-4 w-4 mr-1" />
                Ganti Password
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "preview" | "form")}
        >
          <TabsContent value="preview" className="m-0">
            {/* Social Media Style Header */}
            <div className="relative">
              {/* Background Header dengan kombinasi Primary & Secondary */}
              <div className="h-32 w-full bg-gradient-to-r from-primary/20 via-secondary/20 to-primary/10 border-b" />

              <div className="px-6 pb-6">
                {/* Profile Photo (Initial) */}
                <div className="relative -mt-12 mb-4">
                  <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-card bg-primary text-2xl font-bold text-primary-foreground shadow-md">
                    {getInitials(user?.name)}
                  </div>
                </div>

                {/* User Information */}
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h3 className="text-2xl font-bold tracking-tight">{user?.name || "User Name"}</h3>
                    <div className="flex items-center text-muted-foreground gap-2">
                      <Mail className="h-4 w-4" />
                      <span className="text-sm">{user?.email || "-"}</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Roles & Permissions</p>
                    <div className="flex flex-wrap gap-2">
                      {joinedRoles.length > 0 ? (
                        joinedRoles.map((role) => (
                          <Badge key={role} variant="secondary" className="px-3 py-1 capitalize border-primary/10">
                            <ShieldCheck className="h-3.5 w-3.5 mr-1.5 text-primary" />
                            {role}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">Tidak ada role tersemat</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="form" className="p-6 m-0">
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

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
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

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <Button
                      type="button"
                      variant="ghost"
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
