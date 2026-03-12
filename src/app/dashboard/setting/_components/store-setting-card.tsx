"use client";

import { ChangeEvent, useEffect, useState } from "react";
import { z } from "zod";
import { AxiosError } from "axios";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Building2, Eye, Loader2, MoreVertical, Pencil } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useGetStoreSetting, useUpdateStoreSetting } from "@/hooks/store-setting/use-setting";
import { useUploadImage } from "@/hooks/use-upload-image";
import { ApiResponse } from "@/services/productService";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { compressImage } from "@/components/compress-image";
import Image from "next/image";

const storeSettingSchema = z.object({
  id: z.number().optional(),
  storeName: z.string().min(1, "Nama toko wajib diisi"),
  address: z.string().optional().nullable(),
  phone: z.string().optional().nullable(),
  footerMessage: z.string().optional().nullable(),
  receiptNote: z.string().optional().nullable(),
  logoUrl: z.string().optional().nullable(),
});

type StoreSettingFormValues = z.infer<typeof storeSettingSchema>;

const getErrorMessage = (error: unknown, fallback: string) => {
  const err = error as AxiosError<ApiResponse>;
  return err.response?.data?.error || err.message || fallback;
};

export function StoreSettingCard() {
  const [activeView, setActiveView] = useState<"preview" | "form">("preview");

  const { data: settingResult, isLoading } = useGetStoreSetting();
  const updateStoreMutation = useUpdateStoreSetting();
  const uploadMutation = useUploadImage();

  const form = useForm<StoreSettingFormValues>({
    resolver: zodResolver(storeSettingSchema),
    defaultValues: {
      id: 1,
      storeName: "",
      address: "",
      phone: "",
      footerMessage: "",
      receiptNote: "",
      logoUrl: "",
    },
  });

  const setting = settingResult?.data;
  const logoUrl = form.watch("logoUrl");
  const isUploadingLogo = uploadMutation.isPending;

  useEffect(() => {
    if (!setting) return;

    form.reset({
      id: setting.id ?? 1,
      storeName: setting.storeName ?? "",
      address: setting.address ?? "",
      phone: setting.phone ?? "",
      footerMessage: setting.footerMessage ?? "",
      receiptNote: setting.receiptNote ?? "",
      logoUrl: setting.logoUrl ?? "",
    });
  }, [setting, form]);

  const onSubmit = async (values: StoreSettingFormValues) => {
    try {
      await updateStoreMutation.mutateAsync({
        ...values,
        id: values.id ?? 1,
      });
      toast.success("Informasi toko berhasil diperbarui");
      setActiveView("preview");
    } catch (error) {
      toast.error(getErrorMessage(error, "Gagal memperbarui informasi toko"));
    }
  };

  const handleCancel = () => {
    setActiveView("preview");

    if (!setting) return;

    form.reset({
      id: setting.id ?? 1,
      storeName: setting.storeName ?? "",
      address: setting.address ?? "",
      phone: setting.phone ?? "",
      footerMessage: setting.footerMessage ?? "",
      receiptNote: setting.receiptNote ?? "",
      logoUrl: setting.logoUrl ?? "",
    });
  };

  const handleLogoUpload = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const compressed = await compressImage(file, {
        preserveTransparency: true,
      });

      if (compressed.size > 5 * 1024 * 1024) {
        toast.error("Ukuran file maksimal 5MB");
        return;
      }

      const result = await uploadMutation.mutateAsync(compressed);
      form.setValue("logoUrl", result.secureUrl, {
        shouldDirty: true,
        shouldValidate: true,
      });
      toast.success("Logo berhasil diupload");
    } catch {
      toast.error("Gagal mengupload logo");
    } finally {
      event.target.value = "";
    }
  };

  return (
    <Card className="border shadow-sm">
      <CardHeader className="flex flex-row items-start justify-between gap-3">
        <div className="space-y-1">
          <CardTitle className="text-base flex items-center gap-2">
            <Building2 className="h-4 w-4 text-primary" />
            Setting Store Information
          </CardTitle>
          <CardDescription>
            Kelola informasi toko yang tampil di aplikasi dan struk.
          </CardDescription>
        </div>
        <div className="hidden md:flex gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={activeView === "preview"}
            onClick={handleCancel}
          >
            <Eye className="h-4 w-4 mr-1" />
            Preview
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setActiveView("form")}
            disabled={activeView === "form"}
          >
            <Pencil className="h-4 w-4 mr-1" />
            Edit
          </Button>
        </div>
        <div className="md:hidden">
          <Popover>
            <PopoverTrigger>
              <MoreVertical className="w-4 h-4" />
            </PopoverTrigger>
            <PopoverContent align="end" className="w-fit flex p-2 flex-col items-start">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                disabled={activeView === "preview"}
                onClick={handleCancel}
              >
                <Eye className="h-4 w-4 mr-1" />
                Preview
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setActiveView("form")}
                disabled={activeView === "form"}
              >
                <Pencil className="h-4 w-4 mr-1" />
                Edit
              </Button>
            </PopoverContent>
          </Popover>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs
          value={activeView}
          onValueChange={(value) => setActiveView(value as "preview" | "form")}
          className="space-y-4"
        >

          <TabsContent value="preview">
            {isLoading ? (
              <div className="flex items-center justify-center py-10 text-muted-foreground">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                Memuat data store...
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Logo Store</p>
                  {setting?.logoUrl ? (
                    <Image
                      src={setting.logoUrl}
                      alt="Logo store"
                      width={80}
                      height={80}
                      className="rounded-md border object-cover"
                    />
                  ) : (
                    <p className="font-medium">-</p>
                  )}
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Nama Store</p>
                  <p className="font-medium">{setting?.storeName || "-"}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{setting?.phone || "-"}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Address</p>
                  <p className="font-medium">{setting?.address || "-"}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Footer Message</p>
                  <p className="font-medium">{setting?.footerMessage || "-"}</p>
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <p className="text-xs text-muted-foreground">Receipt Note</p>
                  <p className="font-medium">{setting?.receiptNote || "-"}</p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="form">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="storeName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nama Store</FormLabel>
                      <FormControl>
                        <Input placeholder="Nama toko" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="08xxxxxxxxxx" {...field} value={field.value ?? ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Alamat lengkap toko"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="footerMessage"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Footer Message</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Pesan footer"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="receiptNote"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Receipt Note</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Catatan di struk"
                          {...field}
                          value={field.value ?? ""}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logoUrl"
                  render={() => (
                    <FormItem>
                      <FormLabel>Logo Store</FormLabel>
                      <FormControl>
                        <Input
                          type="file"
                          accept="image/*"
                          onChange={handleLogoUpload}
                          disabled={isUploadingLogo || updateStoreMutation.isPending}
                        />
                      </FormControl>
                      {logoUrl ? (
                        <div className="space-y-2">
                          <Image
                            src={logoUrl}
                            alt="Preview logo store"
                            width={80}
                            height={80}
                            className="rounded-md border object-cover"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              form.setValue("logoUrl", "", {
                                shouldDirty: true,
                                shouldValidate: true,
                              })
                            }
                            disabled={isUploadingLogo || updateStoreMutation.isPending}
                          >
                            Hapus Logo
                          </Button>
                        </div>
                      ) : null}
                      {isUploadingLogo ? (
                        <p className="text-xs text-muted-foreground">Sedang upload logo...</p>
                      ) : null}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex items-center justify-end gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={updateStoreMutation.isPending || isUploadingLogo}
                  >
                    Batal
                  </Button>
                  <Button
                    type="submit"
                    disabled={updateStoreMutation.isPending || isUploadingLogo}
                  >
                    {updateStoreMutation.isPending && (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    )}
                    Simpan Perubahan
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
