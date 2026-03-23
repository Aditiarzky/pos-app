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
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Info,
  Loader2,
  Receipt,
  Percent,
  Banknote,
  Calendar,
  FileText,
  Settings2,
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import { TaxConfig } from "@/services/costService";
import { useCreateTaxConfig, useUpdateTaxConfig } from "@/hooks/cost/use-cost";
import {
  TAX_APPLIES_TO_LABELS,
  TAX_APPLIES_TO_DESCRIPTIONS,
  PERIOD_LABELS,
} from "../../_types/cost-types";
import { z } from "zod";

const formSchema = z
  .object({
    name: z.string().min(1, "Nama pajak wajib diisi").max(150),
    type: z.enum(["percentage", "fixed"] as const),
    ratePercent: z.number().min(0).max(100).nullable().optional(),
    fixedAmount: z.number().positive("Nominal harus lebih dari 0").nullable().optional(),
    appliesTo: z.enum(["revenue", "gross_profit"] as const).nullable().optional(),
    period: z.enum(["daily", "weekly", "monthly", "yearly", "one_time"] as const).default("monthly"),
    effectiveFrom: z.string().min(1, "Tanggal mulai wajib diisi"),
    effectiveTo: z.string().nullable().optional(),
    isActive: z.boolean().default(true),
    notes: z.string().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.type === "percentage") {
      if (data.ratePercent == null) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Persentase pajak wajib diisi", path: ["ratePercent"] });
      }
      if (!data.appliesTo) {
        ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Basis perhitungan wajib dipilih", path: ["appliesTo"] });
      }
    }
    if (data.type === "fixed" && data.fixedAmount == null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Nominal tetap wajib diisi", path: ["fixedAmount"] });
    }
  });

type FormValues = z.infer<typeof formSchema>;

interface Props {
  open: boolean;
  onClose: () => void;
  editingTax?: TaxConfig | null;
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

// ── Pill type selector ────────────────────────────────────────────────────────
function TypePill({
  value,
  selected,
  icon: Icon,
  label,
  description,
  onClick,
}: {
  value: string;
  selected: boolean;
  icon: React.ElementType;
  label: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex flex-1 flex-col gap-1 rounded-lg border-2 p-3 text-left transition-all ${selected
        ? "border-primary bg-primary/5 text-primary"
        : "border-border bg-transparent text-foreground hover:border-muted-foreground/40 hover:bg-muted/40"
        }`}
    >
      <div className="flex items-center gap-1.5">
        <Icon className={`h-4 w-4 ${selected ? "text-primary" : "text-muted-foreground"}`} />
        <span className="text-sm font-semibold">{label}</span>
        {selected && (
          <Badge variant="default" className="ml-auto text-[10px] px-1.5 py-0 h-4">
            Dipilih
          </Badge>
        )}
      </div>
      <p className="text-xs text-muted-foreground leading-tight">{description}</p>
    </button>
  );
}

export function TaxConfigForm({ open, onClose, editingTax }: Props) {
  const isEdit = !!editingTax;

  const resolver = zodResolver(formSchema) as unknown as Resolver<FormValues>;

  const form = useForm<FormValues>({
    resolver,
    defaultValues: {
      name: "",
      type: "percentage",
      ratePercent: null,
      fixedAmount: null,
      appliesTo: "revenue",
      period: "monthly",
      effectiveFrom: new Date().toISOString().slice(0, 10),
      effectiveTo: null,
      isActive: true,
      notes: null,
    } as FormValues,
  });

  const taxType = form.watch("type");
  const appliesTo = form.watch("appliesTo");

  useEffect(() => {
    if (!open) return;
    if (editingTax) {
      form.reset({
        name: editingTax.name,
        type: editingTax.type,
        ratePercent: editingTax.rate != null ? Number(editingTax.rate) * 100 : null,
        fixedAmount: editingTax.fixedAmount != null ? Number(editingTax.fixedAmount) : null,
        appliesTo: editingTax.appliesTo ?? "revenue",
        period: editingTax.period ?? "monthly",
        effectiveFrom: editingTax.effectiveFrom,
        effectiveTo: editingTax.effectiveTo ?? null,
        isActive: editingTax.isActive,
        notes: editingTax.notes ?? null,
      } as FormValues);
    } else {
      form.reset({
        name: "",
        type: "percentage",
        ratePercent: null,
        fixedAmount: null,
        appliesTo: "revenue",
        period: "monthly",
        effectiveFrom: new Date().toISOString().slice(0, 10),
        effectiveTo: null,
        isActive: true,
        notes: null,
      } as FormValues);
    }
  }, [editingTax, form, open]);

  const createMutation = useCreateTaxConfig({
    onSuccess: () => { toast.success("Pajak berhasil ditambahkan"); onClose(); },
    onError: (e) => toast.error(e.message ?? "Gagal menyimpan"),
  });

  const updateMutation = useUpdateTaxConfig({
    onSuccess: () => { toast.success("Pajak berhasil diperbarui"); onClose(); },
    onError: (e) => toast.error(e.message ?? "Gagal memperbarui"),
  });

  const isPending = createMutation.isPending || updateMutation.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      type: values.type,
      rate: values.type === "percentage" && values.ratePercent != null ? values.ratePercent / 100 : null,
      fixedAmount: values.type === "fixed" ? (values.fixedAmount ?? null) : null,
      appliesTo: values.type === "percentage" ? (values.appliesTo ?? null) : null,
      period: values.period,
      effectiveFrom: values.effectiveFrom,
      effectiveTo: values.effectiveTo ?? null,
      isActive: values.isActive,
      notes: values.notes ?? null,
    };

    if (isEdit && editingTax) {
      updateMutation.mutate({ id: editingTax.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
              <Receipt className="h-4 w-4 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-base">
                {isEdit ? "Edit Pajak" : "Tambah Pajak"}
              </DialogTitle>
              <DialogDescription className="text-xs">
                {isEdit ? "Perbarui konfigurasi pajak." : "Konfigurasi pajak yang dipotong dari laba bersih."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit as (data: FormValues) => void)}
            className="space-y-3"
          >

            {/* ── 1. Informasi Dasar ── */}
            <SectionCard icon={FileText} title="Informasi Dasar">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Pajak</FormLabel>
                    <FormControl>
                      <Input placeholder="Contoh: PPh Final UMKM 0,5%" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </SectionCard>

            {/* ── 2. Jenis & Perhitungan ── */}
            <SectionCard icon={Settings2} title="Jenis & Perhitungan">

              {/* Pill selector */}
              <FormField
                control={form.control}
                name="type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="sr-only">Jenis Pajak</FormLabel>
                    <div className="flex gap-2">
                      <TypePill
                        value="percentage"
                        selected={field.value === "percentage"}
                        icon={Percent}
                        label="Persentase"
                        description="Dihitung dari omset atau laba kotor"
                        onClick={() => {
                          field.onChange("percentage");
                          form.setValue("fixedAmount", null);
                          form.setValue("appliesTo", "revenue");
                        }}
                      />
                      <TypePill
                        value="fixed"
                        selected={field.value === "fixed"}
                        icon={Banknote}
                        label="Nominal Tetap"
                        description="Jumlah tetap per periode, misal retribusi"
                        onClick={() => {
                          field.onChange("fixed");
                          form.setValue("ratePercent", null);
                          form.setValue("appliesTo", null);
                        }}
                      />
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Dynamic fields */}
              {taxType === "percentage" ? (
                <div className="space-y-4">
                  {/* Rate + AppliesTo side-by-side */}
                  <div className="grid grid-cols-2 gap-3">
                    <FormField
                      control={form.control}
                      name="ratePercent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tarif Pajak</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                type="number"
                                step="0.01"
                                min={0}
                                max={100}
                                placeholder="0.5"
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(e.target.value ? Number(e.target.value) : null)
                                }
                                className="pr-8"
                              />
                              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
                                %
                              </span>
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs">
                            Misal: <strong>0.5</strong> = 0,5%
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="appliesTo"
                      render={({ field }) => (
                        <FormItem className="w-full max-w-xs"> {/* 1. Batasi lebar FormItem jika perlu */}
                          <FormLabel>Dihitung dari</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value ?? ""}>
                            <FormControl>
                              {/* 2. Tambahkan w-full dan overflow-hidden pada Trigger */}
                              <SelectTrigger className="w-full overflow-hidden">
                                {/* 3. Bungkus SelectValue agar truncate bekerja */}
                                <div className="truncate text-left">
                                  <SelectValue placeholder="Pilih basis" />
                                </div>
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {Object.entries(TAX_APPLIES_TO_LABELS).map(([value, label]) => (
                                <SelectItem key={value} value={value}>
                                  {/* 4. (Opsional) Truncate juga di dalam list agar tetap rapi */}
                                  <span className="truncate">{label}</span>
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                          <span className="mt-4" />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Info alert */}
                  {appliesTo && (
                    <Alert className="border-blue-200 bg-blue-50 py-2.5">
                      <Info className="h-3.5 w-3.5 text-blue-600" />
                      <AlertDescription className="text-xs text-blue-800">
                        <strong>
                          {TAX_APPLIES_TO_LABELS[appliesTo as keyof typeof TAX_APPLIES_TO_LABELS]}:
                        </strong>{" "}
                        {TAX_APPLIES_TO_DESCRIPTIONS[appliesTo]}
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  <FormField
                    control={form.control}
                    name="fixedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nominal (Rp)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min={0}
                            placeholder="50000"
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(e.target.value ? Number(e.target.value) : null)
                            }
                          />
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
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {Object.entries(PERIOD_LABELS).map(([value, label]) => (
                              <SelectItem key={value} value={value}>
                                {label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              )}
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
                      <FormMessage />
                      <span className="mt-4" />
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
                      <FormDescription className="text-xs">Kosongkan jika masih berlaku</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </SectionCard>

            {/* ── 4. Catatan & Status ── */}
            <SectionCard icon={FileText} title="Catatan & Status">
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
                        placeholder="Contoh: Sesuai PP No. 23 Tahun 2018 untuk UMKM"
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
                      <FormLabel className="text-sm font-medium">Pajak Aktif</FormLabel>
                      <FormDescription className="text-xs">
                        Nonaktifkan agar pajak ini tidak dipotong dari laba bersih
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
              <Button type="button" variant="outline" onClick={onClose} disabled={isPending} className="flex-1 sm:flex-none">
                Batal
              </Button>
              <Button type="submit" disabled={isPending} className="flex-1 sm:flex-none">
                {isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <ChevronRight className="h-4 w-4 mr-1" />
                )}
                {isEdit ? "Simpan Perubahan" : "Tambah Pajak"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
