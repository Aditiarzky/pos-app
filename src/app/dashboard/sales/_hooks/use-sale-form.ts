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

interface UseSaleFormProps {
  onSuccess?: () => void;
  createMutation: UseMutationResult<
    ApiResponse<SaleResponse>,
    Error,
    insertSaleType
  >;
  initialData?: SaleResponse | null; // For future edit support
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
  change: number; // Kembalian
  isSubmitting: boolean;
  onSubmit: (data: SaleFormData) => Promise<void>;

  // New States
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
  // Stock Validation
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

  // New State
  const adjustStockMutation = useAdjustStock();
  const [transactionMode, setTransactionMode] = useState<"guest" | "customer">(
    "guest",
  );
  const [isVoucherUsed, setIsVoucherUsed] = useState(false);
  const [isDebt, setIsDebt] = useState(false);
  const [lastSale, setLastSale] = useState<SaleResponse | null>(null);

  // Stock Validation State
  const [isStockModalOpen, setIsStockModalOpen] = useState(false);
  const [insufficientItems, setInsufficientItems] = useState<
    InsufficientStockItem[]
  >([]);
  const [isAdjustingStock, setIsAdjustingStock] = useState(false);

  // Initialize form
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

  // Fetch customers to get balance
  const { data: customersData } = useCustomers();
  const customers = useMemo(
    () =>
      (customersData?.data as (CustomerResponse & { totalDebt: number })[]) ||
      [],
    [customersData],
  );

  // Field array
  const { fields, append, remove, update } = useFieldArray({
    control: form.control,
    name: "items",
  });

  // Watchers
  const items = form.watch("items") || [];
  const customerId = form.watch("customerId");

  // Calculations
  const subtotal = items.reduce((acc, item) => {
    const price = Number(item.price) || 0;
    const qty = Number(item.qty) || 0;
    return acc + price * qty;
  }, 0);

  // Find selected customer balance
  const selectedCustomer = useMemo(() => {
    if (!customerId) return null;
    return customers.find((c) => c.id === customerId) || null;
  }, [customerId, customers]);

  const customerBalance = Number(selectedCustomer?.creditBalance || 0);

  // Voucher Logic Effect
  useEffect(() => {
    if (transactionMode === "guest") {
      form.setValue("customerId", undefined);
      setIsVoucherUsed(false);
      setIsDebt(false);
      form.setValue("totalBalanceUsed", 0);
      return;
    }

    if (transactionMode === "customer") {
      // If isVoucherUsed is true, calculate the amount
      if (isVoucherUsed && customerBalance > 0 && subtotal > 0) {
        const amountToUse = Math.min(customerBalance, subtotal);
        form.setValue("totalBalanceUsed", amountToUse);
      } else {
        form.setValue("totalBalanceUsed", 0);
        // Auto-uncheck if balance becomes 0 or something?
        // User req: "Jika voucher tidak digunakan (checkbox unchecked)..."
        // If customer has balance > 0, default check?
        // User req: "Jika With Customer active AND Customer has balance > 0: Checkbox auto-checked"
      }
    }
  }, [transactionMode, isVoucherUsed, customerBalance, subtotal, form]);

  // Auto-check voucher when customer changes
  useEffect(() => {
    if (customerId && customerBalance > 0) {
      setIsVoucherUsed(true);
    } else {
      setIsVoucherUsed(false);
    }
  }, [customerId, customerBalance]);

  const totalBalanceUsed = Number(form.watch("totalBalanceUsed")) || 0;
  const grandTotal = Math.max(0, subtotal - totalBalanceUsed);
  const totalPaid = Number(form.watch("totalPaid")) || 0;
  const shouldPayOldDebt = form.watch("shouldPayOldDebt") || false;
  const totalDebt = Number(selectedCustomer?.totalDebt || 0);

  const combinedTotal = shouldPayOldDebt ? grandTotal + totalDebt : grandTotal;

  // Change logic:
  // If not paying old debt: change = totalPaid - grandTotal
  // If paying old debt: surplus = max(0, totalPaid - grandTotal), change = max(0, surplus - totalDebt)
  const surplus = Math.max(0, totalPaid - grandTotal);
  const change = shouldPayOldDebt
    ? Math.max(0, surplus - totalDebt)
    : totalPaid - grandTotal;

  const deficiency = Math.max(0, grandTotal - totalPaid);
  const isInsufficient = totalPaid < grandTotal;

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

      toast.success("Stok berhasil disesuaikan, memproses transaksi...", {
        id: toastId,
      });

      // Update local currentStock in form fields so validateStock passes on retry
      const currentItems = form.getValues().items;
      currentItems.forEach((item, index) => {
        const problem = insufficientItems.find(
          (p) => p.productId === item.productId,
        );
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

  const handleSubmit = async (data: SaleFormData) => {
    const toastId = toast.loading("Memproses transaksi...");

    // 1. Validate Stock first if not already in modal flow
    if (!isAdjustingStock) {
      const isStockValid = validateStock();
      if (!isStockValid) {
        toast.dismiss(toastId);
        return;
      }
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
        totalPaid: data.totalPaid,
        totalBalanceUsed: data.totalBalanceUsed,
        isDebt,
        shouldPayOldDebt: !!data.shouldPayOldDebt,
      };

      const response = await createMutation.mutateAsync(payload);

      if (response.success && response.data) {
        setLastSale(response.data);
      }

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
      onSuccess?.();

      toast.success("Transaksi berhasil diproses", { id: toastId });
    } catch (error) {
      toast.error((error as ApiResponse).error || "Gagal memproses transaksi", {
        id: toastId,
      });
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
