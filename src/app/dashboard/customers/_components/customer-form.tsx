"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { customerSchema, CustomerData } from "@/lib/validations/customer";
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
import { Button } from "@/components/ui/button";
import {
  useCreateCustomer,
  useUpdateCustomer,
} from "@/hooks/master/use-customers";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { CustomerResponse } from "@/services/customerService";

interface CustomerFormProps {
  initialData?: CustomerResponse | null;
  onSuccess: () => void;
}

export function CustomerForm({ initialData, onSuccess }: CustomerFormProps) {
  const createMutation = useCreateCustomer();
  const updateMutation = useUpdateCustomer();

  const form = useForm<CustomerData>({
    resolver: zodResolver(customerSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          phone: initialData.phone || "",
          address: initialData.address || "",
        }
      : {
          name: "",
          phone: "",
          address: "",
        },
  });

  const onSubmit = async (data: CustomerData) => {
    try {
      if (initialData) {
        await updateMutation.mutateAsync({ id: initialData.id, ...data });
        toast.success("Pelanggan berhasil diperbarui");
      } else {
        await createMutation.mutateAsync(data);
        toast.success("Pelanggan berhasil ditambahkan");
      }
      onSuccess();
    } catch {
      toast.error("Gagal menyimpan data pelanggan");
    }
  };

  const isLoading = createMutation.isPending || updateMutation.isPending;

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nama Pelanggan</FormLabel>
              <FormControl>
                <Input placeholder="Contoh: Budi Santoso" {...field} />
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
              <FormLabel>Nomor Telepon</FormLabel>
              <FormControl>
                <Input
                  placeholder="Contoh: 08123456789"
                  {...field}
                  value={field.value || ""}
                />
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
              <FormLabel>Alamat</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Alamat lengkap pelanggan..."
                  {...field}
                  value={field.value || ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {initialData ? "Simpan Perubahan" : "Tambah Pelanggan"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
