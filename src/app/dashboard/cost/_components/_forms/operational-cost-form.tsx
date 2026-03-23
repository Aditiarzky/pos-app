"use client";

import { useEffect } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Loader2,
  Wallet,
  Tag,
  Calendar,
  FileText,
  ChevronRight,
  Repeat,
} from "lucide-react";
import { toast } from "sonner";
import { OperationalCost } from "@/services/costService";
import {
  operationalCostSchema,
  OperationalCostType,
} from "@/lib/validations/operational-cost";
import {
  useCreateOperationalCost,
  useUpdateOperationalCost,
} from "@/hooks/cost/use-cost";
import {
  CATEGORY_LABELS,
  CATEGORY_DESCRIPTIONS,
  PERIOD_LABELS,
  PERIOD_DESCRIPTIONS,
} from "../../_types/cost-types";

interface Props {
  open: boolean;
  onClose: () => void;
  editingCost?: OperationalCost | null;
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function SectionCard({
  icon: Icon,
  title,
  children,
}: {
  icon: React.ElementType;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-lg border bg-card">
      <div className="flex items-center gap-2 border-b px-4 py-2.5">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {title}
        </span>
      </div>
      <div className="space-y-4 p-4">{children}</div>
    </div>
  );
}

export function OperationalCostForm({ open, onClose, editingCost }: Props) {
  const isEdit = !!editingCost;

  const resolver =
    zodResolver(operationalCostSchema) as unknown as Resolver<OperationalCostType>;

  const form = useForm<OperationalCostType>({
    resolver,
    defaultValues: {
      name: "",
      category: "other",
      amount: 0,
      period: "monthly",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      isActive: true,
      notes: null,
    },
  });

  useEffect(() => {
    if (!open) return;
    if (editingCost) {
      form.reset({
        name: editingCost.name,
        category: editingCost.category,
        amount: Number(editingCost.amount),
        period: editingCost.period,
        effectiveFrom: editingCost.effectiveFrom,
        effectiveTo: editingCost.effectiveTo ?? null,
        isActive: editingCost.isActive,
        notes: editingCost.notes ?? null,
      });
    } else {
      form.reset({
        name: "",
        category: "other",
        amount: 0,
        period: "monthly",
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: null,
        isActive: true,
        notes: null,
      });
    }
  }, [editingCost, open, form]);

  const createMutation = useCreateOperationalCost({
    onSuccess: () => { toast.success("Biaya berhasil ditambahkan"); onClose(); },
    onError: (e) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const updateMutation = useUpdateOperationalCost({
    onSuccess: () => { toast.success("Biaya berhasil diperbarui"); onClose(); },
    onError: (e) => toast.error(e.message ?? "Gagal memperbarui"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: OperationalCostType) => {
    if (isEdit && editingCost) {
      updateMutation.mutate({ id: editingCost.id, data: values });
    } else {
      createMutation.mutate(values);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Wallet className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Biaya Operasional" : "Tambah Biaya Operasional"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit
                  ? "Perbarui informasi biaya operasional toko."
                  : "Catat pengeluaran rutin untuk menghitung laba bersih."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">

            {/* ── 1. Informasi Biaya ── */}
            <SectionCard icon={FileText} title="Informasi Biaya">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Biaya</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Contoh: Listrik PLN, Gaji Pak Budi, Sewa Toko"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Kategori</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger >
                          <div className="text-left">
                            <SelectValue placeholder="Pilih kategori" />
                          </div>
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            <div>
                              <p className="font-medium">{label}</p>
                              <p className="text-xs text-muted-foreground">
                                {CATEGORY_DESCRIPTIONS[value]}
                              </p>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* ── 2. Nominal & Frekuensi ── */}
            <SectionCard icon={Repeat} title="Nominal & Frekuensi">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nominal (Rp)</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium text-muted-foreground">
                            Rp
                          </span>
                          <Input
                            type="number"
                            min={0}
                            placeholder="500.000"
                            className="pl-9"
                            {...field}
                            value={field.value ?? ""}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="period"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Frekuensi</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger className="w-full overflow-hidden">
                            <div className="truncate text-left">
                              <SelectValue />
                            </div>
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              <div className="truncate text-left">
                                <p className="font-medium">{label}</p>
                                <p className="text-xs text-muted-foreground">
                                  {PERIOD_DESCRIPTIONS[value]}
                                </p>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Penjelasan frekuensi */}
              <p className="text-xs text-muted-foreground">
                Biaya ini akan dihitung sesuai frekuensi yang dipilih dalam laporan laba bersih.
              </p>
            </SectionCard>

            {/* ── 3. Periode Berlaku ── */}
            <SectionCard icon={Calendar} title="Periode Berlaku">
              <div className="grid grid-cols-2 gap-3">
                <FormField
                  control={form.control}
                  name="effectiveFrom"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Mulai Berlaku</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Kapan biaya ini mulai dihitung
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="effectiveTo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Berakhir{" "}
                        <span className="font-normal text-muted-foreground">(opsional)</span>
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value || null)}
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Kosongkan jika masih berlaku
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* ── 4. Catatan & Status ── */}
            <SectionCard icon={Tag} title="Catatan & Status">
              <FormField
                control={form.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Catatan{" "}
                      <span className="font-normal text-muted-foreground">(opsional)</span>
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Contoh: Dibayar tiap tanggal 5, rekening BCA"
                        rows={2}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value || null)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-muted/30 px-4 py-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm font-medium">Biaya Aktif</FormLabel>
                      <FormDescription className="text-xs">
                        Nonaktifkan agar biaya ini tidak dihitung dalam laporan laba bersih
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch checked={field.value ?? true} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />
            </SectionCard>

            <DialogFooter className="gap-2 pt-1">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={isPending}
                className="flex-1 sm:flex-none"
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                {isEdit ? "Simpan Perubahan" : "Tambah Biaya"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
