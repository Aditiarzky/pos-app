import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { UseMutationResult } from "@tanstack/react-query";
import { insertSaleSchema, insertSaleType } from "@/lib/validations/sale";
import { SaleFormData, SaleFormItem, SaleResponse } from "../_types/sale-type";
import { ApiResponse } from "@/services/productService";
import { toast } from "sonner";
import { useState, useEffect, useMemo } from "react";
import { useCustomers } from "@/hooks/master/use-customers";
import { CustomerResponse } from "@/services/customerService";
import { InsufficientStockItem } from "../_components/_ui/stock-warning-modal";
import { useAdjustStock } from "@/hooks/products/use-adjust-stock";
import { QrisPaymentData } from "@/components/qris-payment-modal";

interface UseSaleFormProps {
  onSuccess?: () => void;
  createMutation: UseMutationResult<
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ApiResponse<any>,
    Error,
    insertSaleType
  >;
  initialData?: SaleResponse | null;
  isOpen?: boolean;
}

interface UseSaleFormReturn {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  form: any;
  fields: SaleFormItem[];
  append: (item: SaleFormItem) => void;
  remove: (index: number) => void;
  update: (index: number, item: SaleFormItem) => void;
  total: number;
  subtotal: number;
  change: number;
  isSubmitting: boolean;
  onSubmit: (data: SaleFormData) => Promise<void>;

  transactionMode: "guest" | "customer";
  setTransactionMode: (mode: "guest" | "customer") => void;
  isVoucherUsed: boolean;
  setIsVoucherUsed: (used: boolean) => void;
  customerBalance: number;
  isDebt: boolean;
  setIsDebt: (debt: boolean) => void;
  combinedTotal: number;
  isInsufficient: boolean;
  deficiency: number;
  customers: (CustomerResponse & { totalDebt: number })[];
  selectedCustomer: (CustomerResponse & { totalDebt: number }) | null;

  lastSale: SaleResponse | null;
  setLastSale: (sale: SaleResponse | null) => void;

  paymentMethod: "cash" | "qris";
  setPaymentMethod: (method: "cash" | "qris") => void;

  qrisData: QrisPaymentData | null;
  setQrisData: (data: QrisPaymentData | null) => void;
  handleQrisSuccess: (saleId: number) => void;

  isStockModalOpen: boolean;
  setIsStockModalOpen: (open: boolean) => void;
  insufficientItems: InsufficientStockItem[];
  handleAdjustStock: () => Promise<void>;
  isAdjustingStock: boolean;
}

export function useSaleForm({
  onSuccess,
  createMutation,
}: UseSaleFormProps): UseSaleFormReturn {
  const { user } = useAuth();

  const adjustStockMutation = useAdjustStock();

  const [transactionMode, setTransactionMode] = useState<"guest" | "customer">("guest");
  const [isVoucherUsed, setIsVoucherUsed] = useState(false);
  const [isDebt, setIsDebt] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);

  const [paymentMethod, setPaymentMethod] = useState<"cash" | "qris">("cash");
  const [qrisData, setQrisData] = useState<QrisPaymentData | null>(null);

  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [insufficientItems, setInsufficientItems] = useState<InsufficientStockItem[]>([]);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  const form = useForm<SaleFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(insertSaleSchema as any),
    defaultValues: {
      customerId: undefined,
      userId: user?.id,
      items: [],
      totalPaid: 0,
      totalBalanceUsed: 0,
      shouldPayOldDebt: false,
    },
  });

  const { data: customersData } = useCustomers();
  const customers = useMemo(
    () => (customersData?.data as (CustomerResponse & { totalDebt: number })[]) || [],
    [customersData],
  );

  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  const items = form.watch("items") || [];
  const customerId = form.watch("customerId");

  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return customers.find((c) => c.id === customerId) || null;
  }, [customerId, customers]);

  const customerBalance = Number(selectedCustomer?.creditBalance || 0);

  // Voucher logic
  useEffect(() => {
    if (transactionMode === "guest") {
      form.setValue("customerId", undefined);
      setIsVoucherUsed(false);
      setIsDebt(false);
      form.setValue("totalBalanceUsed", 0);
      return;
    }

    if (transactionMode === "customer") {
      if (isVoucherUsed && customerBalance > 0 && subtotal > 0) {
        const amountToUse = Math.min(customerBalance, subtotal);
        form.setValue("totalBalanceUsed", amountToUse);
      } else {
        form.setValue("totalBalanceUsed", 0);
      }
    }
  }, [transactionMode, isVoucherUsed, customerBalance, subtotal, form]);

  // Auto-check voucher saat customer berubah
  useEffect(() => {
    if (customerId && customerBalance > 0) {
      setIsVoucherUsed(true);
    } else {
      setIsVoucherUsed(false);
    }
  }, [customerId, customerBalance]);

  // QRIS tidak support hutang
  useEffect(() => {
    if (paymentMethod === "qris") {
      setIsDebt(false);
    }
  }, [paymentMethod]);

  const totalBalanceUsed = Number(form.watch("totalBalanceUsed")) || 0;
  const grandTotal = Math.max(0, subtotal - totalBalanceUsed);
  const totalPaid = Number(form.watch("totalPaid")) || 0;
  const shouldPayOldDebt = form.watch("shouldPayOldDebt") || false;
  const totalDebt = Number(selectedCustomer?.totalDebt || 0);

  const combinedTotal = shouldPayOldDebt ? grandTotal + totalDebt : grandTotal;

  const surplus = Math.max(0, totalPaid - grandTotal);
  const change = shouldPayOldDebt
    ? Math.max(0, surplus - totalDebt)
    : totalPaid - grandTotal;

  const deficiency = Math.max(0, grandTotal - totalPaid);
  const isInsufficient = paymentMethod === "cash" && totalPaid < grandTotal;

  const validateStock = () => {
    const problematicItems: InsufficientStockItem[] = [];

    items.forEach((item) => {
      const requestedQty = Number(item.qty);
      const conversionFactor = Number(item.conversionToBase || 1);
      const requestedTotalBase = requestedQty * conversionFactor;
      const currentStock = Number(item.currentStock || 0);

      if (requestedTotalBase > currentStock) {
        problematicItems.push({
          variantId: item.variantId,
          productId: item.productId,
          productName: item.productName || "Unknown",
          variantName: item.variantName || "Default",
          qty: item.qty,
          requestedQty: requestedTotalBase,
          currentStock,
          difference: requestedTotalBase - currentStock,
          conversionToBase: conversionFactor,
        });
      }
    });

    if (problematicItems.length > 0) {
      setInsufficientItems(problematicItems);
      setIsStockModalOpen(true);
      return false;
    }

    return true;
  };

  const handleAdjustStock = async () => {
    setIsAdjustingStock(true);
    const toastId = toast.loading("Menyesuaikan stok...");

    try {
      for (const item of insufficientItems) {
        await adjustStockMutation.mutateAsync({
          id: item.productId,
          userId: user?.id || 0,
          variants: [{ variantId: item.variantId || 0, qty: item.qty }],
        });
      }

      toast.success("Stok berhasil disesuaikan, memproses transaksi...", { id: toastId });

      const currentItems = form.getValues().items;
      currentItems.forEach((item, index) => {
        const problem = insufficientItems.find((p) => p.productId === item.productId);
        if (problem) {
          form.setValue(`items.${index}.currentStock`, problem.requestedQty);
        }
      });

      await handleSubmit(form.getValues());
      setIsStockModalOpen(false);
    } catch (error) {
      toast.error(
        error ? (error as ApiResponse).error : "Gagal menyesuaikan stok",
        { id: toastId },
      );
    } finally {
      setIsAdjustingStock(false);
    }
  };

  // Callback saat polling detect payment berhasil
  const handleQrisSuccess = async (saleId: number) => {
    try {
      const { getSaleById } = await import("@/services/saleService");
      const res = await getSaleById(saleId);
      if (res.success && res.data) {
        setQrisData(null);
        // Cast res.data to the local SaleResponse type to resolve type incompatibility
        setLastSale(res.data as SaleResponse);
      }
    } catch {
      setQrisData(null);
    }
  };

  // ─── PENTING: reset form fields tanpa menyentuh paymentMethod ────────────
  // paymentMethod direset SETELAH qrisData di-set supaya modal sempat render
  const resetFormFields = () => {
    form.reset({
      customerId: undefined,
      userId: user?.id,
      items: [],
      totalPaid: 0,
      totalBalanceUsed: 0,
      shouldPayOldDebt: false,
    });
    setIsVoucherUsed(false);
    setIsDebt(false);
    setTransactionMode("guest");
  };

  const handleSubmit = async (data: SaleFormData) => {
    const toastId = toast.loading("Memproses transaksi...");

    if (!isAdjustingStock) {
      const isStockValid = validateStock();
      if (!isStockValid) {
        toast.dismiss(toastId);
        return;
      }
    }

    if (paymentMethod === "cash" && !isDebt && Number(data.totalPaid) <= 0) {
      toast.error("Masukkan jumlah pembayaran yang diterima", { id: toastId });
      return;
    }

    try {
      const cleanedItems = data.items.map((item) => ({
        productId: item.productId,
        variantId: item.variantId,
        unitFactorAtSale: "1",
        qty: item.qty,
      }));

      const payload = {
        customerId: transactionMode === "guest" ? undefined : data.customerId,
        userId: user?.id || 0,
        items: cleanedItems,
        totalPaid: paymentMethod === "qris" ? 0 : data.totalPaid,
        totalBalanceUsed: data.totalBalanceUsed,
        isDebt: paymentMethod === "cash" ? isDebt : false,
        shouldPayOldDebt: paymentMethod === "cash" ? !!data.shouldPayOldDebt : false,
        paymentMethod,
      };

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const response = await createMutation.mutateAsync(payload as any);

      if (response.success && response.data) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const rawData = response.data as any;

        if (paymentMethod === "qris" && rawData.qrisData) {
          setQrisData({
            paymentNumber: rawData.qrisData.paymentNumber,
            expiredAt: rawData.qrisData.expiredAt,
            saleId: rawData.id,
            invoiceNumber: rawData.invoiceNumber,
            amount: grandTotal,
            totalPayment: rawData.qrisData.totalPayment,
            fee: rawData.qrisData.fee,
          });

          resetFormFields();
          setPaymentMethod("cash"); // reset terakhir, setelah qrisData sudah di state

          onSuccess?.();
          toast.success("QR Code siap, silakan scan untuk membayar", { id: toastId });
        } else {
          // Cash: langsung tampilkan receipt
          setLastSale(rawData);
          resetFormFields();
          setPaymentMethod("cash");
          onSuccess?.();
          toast.success("Transaksi berhasil diproses", { id: toastId });
        }
      }
    } catch (error) {
      toast.error((error as ApiResponse).error || "Gagal memproses transaksi", { id: toastId });
    }
  };

  return {
    form,
    fields: fields as SaleFormItem[],
    append,
    remove,
    update,
    total: subtotal,
    subtotal,
    change,
    isSubmitting: createMutation.isPending,
    onSubmit: handleSubmit,
    transactionMode,
    setTransactionMode,
    isVoucherUsed,
    setIsVoucherUsed,
    customerBalance,
    isDebt,
    setIsDebt,
    lastSale,
    setLastSale,
    paymentMethod,
    setPaymentMethod,
    qrisData,
    setQrisData,
    handleQrisSuccess,
    combinedTotal,
    isInsufficient,
    deficiency,
    customers,
    selectedCustomer,
    isStockModalOpen,
    setIsStockModalOpen,
    insufficientItems,
    handleAdjustStock,
    isAdjustingStock,
  };
}
