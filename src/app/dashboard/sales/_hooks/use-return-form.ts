"use client";

import { useState, useMemo, useCallback } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useCreateCustomerReturn } from "@/hooks/customer-returns/use-customer-return";
import { getSaleByInvoice, getSaleById } from "@/services/saleService";
import { SaleResponse } from "@/services/saleService";
import { ProductResponse } from "@/services/productService";
import { toast } from "sonner";
import { formatCurrency } from "@/lib/format";
import { insertCustomerReturnPayload } from "@/services/customerReturnService";

export interface ReturnItemEntry {
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  priceAtSale: number;
  originalQty: number; // Qty asli di invoice
  previouslyReturnedQty: number; // Qty yang sudah pernah diretur sebelumnya
  maxQty: number; // Sisa yang bisa diretur (original - previous)
  unitFactorAtReturn: number;
  qty: number;
  returnedToStock: boolean;
  reason: string;
  selected: boolean;
  isFullyReturned: boolean;
}

export interface ExchangeItemEntry {
  productId: number;
  variantId: number;
  productName: string;
  variantName: string;
  sku: string;
  sellPrice: number;
  qty: number;
  currentStock: number;
  image?: string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  variants?: any[];
}

export type CompensationType = "refund" | "credit_note" | "exchange";

export type ReturnStep = "invoice" | "items" | "summary";

export interface ReturnResult {
  returnNumber: string;
  compensationType: CompensationType;
  netRefundAmount: number;
  customerName: string;
  message: string;
  saleData: SaleResponse;
  returnItems: ReturnItemEntry[];
  exchangeItems: ExchangeItemEntry[];
  totalValueReturned: number;
  totalValueExchange: number;
}

// ============================================
// HOOK
// ============================================

export function useReturnForm() {
  const { user } = useAuth();
  const createReturnMutation = useCreateCustomerReturn();

  // Step management
  const [step, setStep] = useState<ReturnStep>("invoice");

  // Invoice lookup
  const [invoiceInput, setInvoiceInput] = useState("");
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [saleData, setSaleData] = useState<SaleResponse | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);

  // Return items (derived from sale items)
  const [returnItems, setReturnItems] = useState<ReturnItemEntry[]>([]);

  // Customer selection (for guest sales)
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    null,
  );

  // Compensation
  const [compensationType, setCompensationType] =
    useState<CompensationType>("refund");

  // Exchange items
  const [exchangeItems, setExchangeItems] = useState<ExchangeItemEntry[]>([]);

  // Result (after successful submit)
  const [returnResult, setReturnResult] = useState<ReturnResult | null>(null);

  // ============================================
  // INVOICE LOOKUP
  // ============================================

  const lookupInvoice = useCallback(
    async (invoice?: string) => {
      const searchValue = (invoice || invoiceInput).trim();
      if (!searchValue) {
        setLookupError("Masukkan nomor invoice");
        return;
      }

      setIsLookingUp(true);
      setLookupError(null);

      try {
        const sale = await getSaleByInvoice(searchValue);

        if (!sale) {
          setLookupError("Invoice tidak ditemukan");
          return;
        }

        if (sale.isArchived) {
          setLookupError("Penjualan ini sudah dibatalkan");
          return;
        }

        // Fetch full sale details with product+variant info
        const fullSaleResponse = await getSaleById(sale.id!);
        const fullSale = fullSaleResponse.data;

        if (!fullSale) {
          setLookupError("Gagal memuat detail penjualan");
          return;
        }

        setSaleData(fullSale);
        setSelectedCustomerId(fullSale.customerId || null);

        // Build return items from sale items
        const items: ReturnItemEntry[] =
          fullSale.items?.map((item) => {
            // Hitung total yang sudah diretur sebelumnya untuk item ini
            // @ts-expect-error - customerReturns is included in fullSale via relations
            const previousItems = (fullSale.customerReturns || [])
              // @ts-expect-error - Retyping nested relation items
              .flatMap((ret) => ret.items || [])
              // @ts-expect-error - Filter variantId from nested items
              .filter((ri) => ri.variantId === item.variantId);

            const previouslyReturnedQty = previousItems.reduce(
              // @ts-expect-error - Summing qty from nested objects
              (sum, ri) => sum + Number(ri.qty),
              0,
            );

            const originalQty = Number(item.qty);
            const remainingQty = Math.max(
              0,
              originalQty - previouslyReturnedQty,
            );

            return {
              productId: item.productId,
              variantId: item.variantId,
              productName: item.product?.name || "Unknown",
              variantName: item.productVariant?.name || "Default",
              priceAtSale: Number(item.priceAtSale),
              unitFactorAtReturn: Number(item.unitFactorAtSale),
              originalQty,
              previouslyReturnedQty,
              maxQty: remainingQty,
              qty: 0,
              returnedToStock: true,
              reason: "",
              selected: false,
              isFullyReturned: remainingQty <= 0,
            };
          }) || [];

        setReturnItems(items);
        setStep("items");
      } catch {
        setLookupError("Gagal mencari invoice. Coba lagi.");
      } finally {
        setIsLookingUp(false);
      }
    },
    [invoiceInput],
  );

  // ============================================
  // RETURN ITEM MANAGEMENT
  // ============================================

  const toggleItemSelected = useCallback((index: number) => {
    setReturnItems((prev) =>
      prev.map((item, i) =>
        i === index
          ? {
              ...item,
              selected: !item.selected,
              qty: !item.selected ? Math.max(1, item.qty) : 0,
            }
          : item,
      ),
    );
  }, []);

  const updateReturnItem = useCallback(
    (index: number, updates: Partial<ReturnItemEntry>) => {
      setReturnItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
      );
    },
    [],
  );

  // ============================================
  // EXCHANGE ITEM MANAGEMENT
  // ============================================

  const addExchangeItem = useCallback(
    (product: ProductResponse, variant: ProductResponse["variants"][0]) => {
      const existingIndex = exchangeItems.findIndex(
        (e) => e.variantId === variant.id,
      );

      if (existingIndex > -1) {
        setExchangeItems((prev) =>
          prev.map((item, i) =>
            i === existingIndex ? { ...item, qty: item.qty + 1 } : item,
          ),
        );
      } else {
        setExchangeItems((prev) => [
          ...prev,
          {
            productId: product.id,
            variantId: variant.id,
            productName: product.name,
            variantName: variant.name,
            sku: variant.sku,
            sellPrice: Number(variant.sellPrice),
            qty: 1,
            currentStock: Number(product.stock),
            image: product.image,
            variants: product.variants,
          },
        ]);
      }
    },
    [exchangeItems],
  );

  const updateExchangeItem = useCallback(
    (index: number, updates: Partial<ExchangeItemEntry>) => {
      setExchangeItems((prev) =>
        prev.map((item, i) => (i === index ? { ...item, ...updates } : item)),
      );
    },
    [],
  );

  const removeExchangeItem = useCallback((index: number) => {
    setExchangeItems((prev) => prev.filter((_, i) => i !== index));
  }, []);

  // ============================================
  // CALCULATIONS
  // ============================================

  const selectedReturnItems = useMemo(
    () => returnItems.filter((item) => item.selected && item.qty > 0),
    [returnItems],
  );

  const totalValueReturned = useMemo(
    () =>
      selectedReturnItems.reduce(
        (acc, item) => acc + item.qty * item.priceAtSale,
        0,
      ),
    [selectedReturnItems],
  );

  const totalValueExchange = useMemo(
    () =>
      exchangeItems.reduce((acc, item) => acc + item.qty * item.sellPrice, 0),
    [exchangeItems],
  );

  const netRefundAmount = useMemo(
    () => totalValueReturned - totalValueExchange,
    [totalValueReturned, totalValueExchange],
  );

  // Exchange validation: exchange value must not exceed return value
  const isExchangeOverLimit = useMemo(
    () =>
      compensationType === "exchange" &&
      totalValueExchange > totalValueReturned,
    [compensationType, totalValueExchange, totalValueReturned],
  );

  // ============================================
  // VALIDATION
  // ============================================

  const canSubmit = useMemo(() => {
    if (selectedReturnItems.length === 0) return false;

    // All selected items must have qty > 0 and qty <= maxQty
    const allValid = selectedReturnItems.every(
      (item) => item.qty > 0 && item.qty <= item.maxQty,
    );
    if (!allValid) return false;

    // Exchange: must have exchange items and value must not exceed return
    if (compensationType === "exchange") {
      if (exchangeItems.length === 0) return false;
      if (isExchangeOverLimit) return false;
    }

    // Credit note: must have customer on the sale or selected
    if (
      compensationType === "credit_note" &&
      !saleData?.customerId &&
      !selectedCustomerId
    ) {
      return false;
    }

    // Guest sale with selected compensation but no customer selected
    if (!saleData?.customerId && !selectedCustomerId) {
      return false;
    }

    return true;
  }, [
    selectedReturnItems,
    compensationType,
    exchangeItems,
    isExchangeOverLimit,
    saleData,
    selectedCustomerId,
  ]);

  // ============================================
  // SUBMIT
  // ============================================

  const handleSubmit = useCallback(async () => {
    if (!saleData || !canSubmit) return;

    const toastId = toast.loading("Memproses retur...");

    try {
      const payload: insertCustomerReturnPayload = {
        saleId: saleData.id!,
        userId: user?.id || 0,
        compensationType,
        customerId: saleData.customerId || selectedCustomerId || null,
        items: selectedReturnItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty,
          returnedToStock: item.returnedToStock,
          reason: item.reason || "Customer Return",
        })),
        exchangeItems:
          compensationType === "exchange"
            ? exchangeItems.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                qty: item.qty,
              }))
            : undefined,
      };

      const response = await createReturnMutation.mutateAsync(payload);

      if (response.success && response.data) {
        const resultData = response.data as unknown as {
          returnHeader: { returnNumber: string };
          netChange: number;
          message: string;
        };

        setReturnResult({
          returnNumber: resultData.returnHeader.returnNumber,
          compensationType,
          netRefundAmount: resultData.netChange,
          message: resultData.message,
          customerName: saleData.customer?.name || "Guest",
          saleData,
          returnItems: selectedReturnItems,
          exchangeItems,
          totalValueReturned,
          totalValueExchange,
        });

        toast.success("Retur berhasil diproses", { id: toastId });
      }
    } catch (error) {
      const errMsg =
        (error as { error?: string })?.error || "Gagal memproses retur";
      toast.error(errMsg, { id: toastId });
    }
  }, [
    saleData,
    canSubmit,
    user,
    compensationType,
    selectedReturnItems,
    exchangeItems,
    createReturnMutation,
    totalValueReturned,
    totalValueExchange,
    selectedCustomerId,
  ]);

  // ============================================
  // RESET
  // ============================================

  const resetForm = useCallback(() => {
    setStep("invoice");
    setInvoiceInput("");
    setSaleData(null);
    setLookupError(null);
    setReturnItems([]);
    setSelectedCustomerId(null);
    setCompensationType("refund");
    setExchangeItems([]);
    setReturnResult(null);
  }, []);

  const goBackToInvoice = useCallback(() => {
    setStep("invoice");
    setSaleData(null);
    setReturnItems([]);
    setExchangeItems([]);
    setSelectedCustomerId(null);
    setCompensationType("refund");
  }, []);

  // ============================================
  // SUMMARY TEXT
  // ============================================

  const summaryText = useMemo(() => {
    if (compensationType === "exchange") {
      if (netRefundAmount > 0) {
        return `Sisa uang ${formatCurrency(netRefundAmount)} dikembalikan ke pelanggan`;
      } else if (netRefundAmount < 0) {
        return `Pelanggan perlu membayar kekurangan ${formatCurrency(Math.abs(netRefundAmount))}`;
      }
      return "Tukar barang senilai (pas)";
    }
    if (compensationType === "credit_note") {
      return `Saldo ${formatCurrency(totalValueReturned)} ditambahkan ke akun pelanggan`;
    }
    return `Refund tunai ${formatCurrency(totalValueReturned)} ke pelanggan`;
  }, [compensationType, netRefundAmount, totalValueReturned]);

  return {
    // Step
    step,

    // Invoice lookup
    invoiceInput,
    setInvoiceInput,
    isLookingUp,
    lookupInvoice,
    lookupError,

    // Sale data
    saleData,

    // Return items
    returnItems,
    selectedReturnItems,
    toggleItemSelected,
    updateReturnItem,

    // Customer
    selectedCustomerId,
    setSelectedCustomerId,

    // Compensation
    compensationType,
    setCompensationType,

    // Exchange items
    exchangeItems,
    addExchangeItem,
    updateExchangeItem,
    removeExchangeItem,

    // Calculations
    totalValueReturned,
    totalValueExchange,
    netRefundAmount,
    isExchangeOverLimit,
    summaryText,

    // Submission
    canSubmit,
    isSubmitting: createReturnMutation.isPending,
    handleSubmit,

    // Result
    returnResult,
    setReturnResult,

    // Reset
    resetForm,
    goBackToInvoice,
  };
}
