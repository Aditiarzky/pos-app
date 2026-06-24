"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Loader2,
  ArrowLeft,
  ArrowRight,
  Save,
  Check,
  Eye,
  EyeOff,
  UserCog,
  ShieldCheck,
} from "lucide-react";
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
import { cn } from "@/lib/utils";
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

const STEPS = [
  { id: 1, label: "Identitas" },
  { id: 2, label: "Keamanan" },
  { id: 3, label: "Role Akses" },
];

export function UserFormModal({
  open,
  onOpenChange,
  userData,
}: UserFormModalProps) {
  const isEditing = !!userData;
  const [currentStep, setCurrentStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);

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
      setCurrentStep(1);
      setShowPassword(false);
      if (userData) {
        form.reset({
          name: userData.name,
          email: userData.email,
          role: userData.roles[0]?.role,
          password: "",
        });
      } else {
        form.reset({ name: "", email: "", password: "", role: undefined });
      }
    }
  }, [open, userData, form]);

  const goNext = async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    let valid = false;
    if (currentStep === 1) {
      valid = await form.trigger(["name", "email"]);
    } else if (currentStep === 2) {
      valid = await form.trigger(["password"]);
    } else if (currentStep === 3) {
      valid = await form.trigger(["role"]);
    }
    if (valid) setCurrentStep((s) => Math.min(s + 1, STEPS.length));
  };

  const goBack = () => setCurrentStep((s) => Math.max(s - 1, 1));

  const onSubmit = async (data: CreateUserInputType | UpdateUserInputType) => {
    try {
      if (isEditing) {
        if (!userData) return;
        const updateData = { ...data } as UpdateUserInputType;
        if (!updateData.password) delete updateData.password;
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
      const err = error as ApiResponse;
      const errorMessage = err.error || "Terjadi kesalahan saat menyimpan user";
      toast.error(errorMessage);
    }
  };

  const watchedValues = form.watch();
  const isLastStep = currentStep === STEPS.length;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit User" : "Tambah User"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Ubah informasi user di sini."
              : "Tambahkan user baru ke dalam sistem."}
          </DialogDescription>
        </DialogHeader>

        {/* Step Indicator */}
        <div className="flex items-center gap-0 my-2">
          {STEPS.map((step, idx) => (
            <div
              key={step.id}
              className="flex items-center flex-1 last:flex-none"
            >
              <div className="flex flex-col items-center gap-1">
                <div
                  className={cn(
                    "w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium border transition-all duration-200",
                    currentStep === step.id &&
                      "border-primary bg-primary/10 text-primary",
                    currentStep > step.id &&
                      "border-primary bg-primary text-primary-foreground",
                    currentStep < step.id &&
                      "border-muted-foreground/30 text-muted-foreground bg-background",
                  )}
                >
                  {currentStep > step.id ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <span>{step.id}</span>
                  )}
                </div>
                <span
                  className={cn(
                    "text-[10px] whitespace-nowrap transition-colors",
                    currentStep === step.id
                      ? "text-foreground font-medium"
                      : "text-muted-foreground",
                  )}
                >
                  {step.label}
                </span>
              </div>

              {/* Connector line */}
              {idx < STEPS.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-px mx-2 mb-4 transition-colors duration-300",
                    currentStep > step.id ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </div>
          ))}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Step 1: Identitas */}
            {currentStep === 1 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
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
              </div>
            )}

            {/* Step 2: Keamanan */}
            {currentStep === 2 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {isEditing ? "Password (Opsional)" : "Password"}
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Input
                            placeholder={
                              isEditing
                                ? "Kosongkan jika tidak ingin mengubah"
                                : "Password"
                            }
                            type={showPassword ? "text" : "password"}
                            className="pr-10"
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                          >
                            {showPassword ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* Step 3: Role Akses */}
            {currentStep === 3 && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem className="space-y-3">
                      <div>
                        <FormLabel className="text-base font-semibold">
                          Role Akses
                        </FormLabel>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          Pilih satu role untuk menentukan hak akses user.
                        </p>
                      </div>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
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
                                <span className="font-semibold text-sm">
                                  Admin Toko
                                </span>
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
                                <span className="font-semibold text-sm">
                                  Admin Sistem
                                </span>
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

                {/* Ringkasan sebelum submit */}
                <div className="rounded-xl border bg-muted/40 p-3 space-y-2 text-sm">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Ringkasan
                  </p>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Nama</span>
                    <span className="font-medium">
                      {watchedValues.name || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Email</span>
                    <span className="font-medium">
                      {watchedValues.email || "—"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Password</span>
                    <span className="font-medium">••••••••</span>
                  </div>
                </div>
              </div>
            )}

            {/* Footer Actions */}
            <DialogFooter className="flex flex-row justify-between pt-2 gap-2">
              <div>
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={goBack}
                    disabled={isPending}
                  >
                    <ArrowLeft className="h-4 w-4 mr-1" />
                    Kembali
                  </Button>
                )}
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">
                  {currentStep} / {STEPS.length}
                </span>
                <Button
                  type={isLastStep ? "submit" : "button"}
                  className="rounded-xl shadow-md"
                  onClick={isLastStep ? undefined : (e) => goNext(e)}
                  disabled={isPending}
                >
                  {isPending && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  {isLastStep ? (
                    <>
                      <Save className="h-4 w-4 mr-1.5" />
                      Simpan
                    </>
                  ) : (
                    <>
                      Lanjut
                      <ArrowRight className="h-4 w-4 ml-1.5" />
                    </>
                  )}
                </Button>
              </div>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
