import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { and, eq, not, sql } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import {
  customerExchangeItems,
  customerReturnItems,
  customerReturns,
  customers,
  customerBalanceMutations,
  products,
  productVariants,
  sales,
  stockMutations,
} from "@/drizzle/schema";
import { validateInsertCustomerReturnData } from "@/lib/validations/customer-return";
import { handleApiError } from "@/lib/api-utils";
import {
  CompensationTypeEnumType,
  CustomerReturnExchangeItemType,
  CustomerReturnItemType,
  InsertStockMutationType,
} from "@/drizzle/type";

// GET all customer-returns with search and filters
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    // Advanced Filters
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const compensationType = searchParams.get("compensationType");
    const customerId = searchParams.get("customerId");

    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      customerReturns.returnNumber,
    );

    let filter = and(eq(customerReturns.isArchived, false), searchFilter);

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter = and(filter, sql`${customerReturns.createdAt} >= ${start}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter = and(filter, sql`${customerReturns.createdAt} <= ${end}`);
    }
    if (compensationType) {
      filter = and(
        filter,
        eq(
          customerReturns.compensationType,
          compensationType as CompensationTypeEnumType,
        ),
      );
    }
    if (customerId) {
      filter = and(filter, eq(customerReturns.customerId, Number(customerId)));
    }

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [customerReturnsData, totalRes, todayAnalyticsRes, lifetimeRes] =
      await Promise.all([
        db.query.customerReturns.findMany({
          where: filter,
          orderBy: searchOrder,
          limit: params.limit,
          offset: params.offset,
          with: {
            customer: true,
            sales: true,
            items: true,
            exchangeItems: true,
          },
        }),
        db
          .select({ count: sql<number>`count(*)` })
          .from(customerReturns)
          .where(filter),
        db
          .select({
            totalRefund: sql<string>`sum(${customerReturns.totalRefund})`,
            count: sql<number>`count(*)`,
          })
          .from(customerReturns)
          .where(
            and(
              not(customerReturns.isArchived),
              sql`${customerReturns.createdAt} >= ${startOfToday}`,
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(customerReturns)
          .where(not(customerReturns.isArchived)),
      ]);

    const totalCount = Number(totalRes[0]?.count || 0);
    const todayRefund = Number(todayAnalyticsRes[0]?.totalRefund || 0);
    const todayCount = Number(todayAnalyticsRes[0]?.count || 0);
    const lifetimeCount = Number(lifetimeRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customerReturnsData,
      analytics: {
        totalRefundsToday: todayRefund,
        returnsTodayCount: todayCount,
        totalReturnsLifetime: lifetimeCount,
      },
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// POST create customer-return
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Pastikan validasi Zod Anda mengizinkan exchangeItems array kosong
    const validation = await validateInsertCustomerReturnData(body);
    const {
      saleId,
      customerId: payloadCustomerId, // Customer ID dari payload (untuk guest sale)
      userId,
      items: returnedItems, // Array barang yang dikembalikan
      exchangeItems, // Array barang pengganti (opsional)
      compensationType, // 'refund' | 'credit_note' | 'exchange'
      surplusStrategy, // 'cash' | 'credit_balance'
    } = validation;

    const result = await db.transaction(async (tx) => {
      // 1. Ambil Data Penjualan Asal
      const existingSale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
        with: {
          items: true,
          customerReturns: {
            where: eq(customerReturns.isArchived, false),
            with: {
              items: true,
            },
          },
        },
      });

      if (!existingSale) throw new Error("Data penjualan tidak ditemukan");
      if (existingSale.isArchived)
        throw new Error("Penjualan ini sudah dibatalkan/archived");

      // --- 1.5 UPDATE CUSTOMER ID JIKA GUEST SALE ---
      let finalCustomerId = existingSale.customerId;
      if (!existingSale.customerId && payloadCustomerId) {
        await tx
          .update(sales)
          .set({ customerId: payloadCustomerId })
          .where(eq(sales.id, saleId));
        finalCustomerId = payloadCustomerId;
      }

      const returnNumber = `RET-${Date.now()}`;

      // Variable penampung nilai uang
      let totalValueReturned = 0; // Nilai bruto semua barang yang dikembalikan (qty * harga saat beli)
      let totalValueExchange = 0; // Nilai bruto semua barang pengganti (qty * harga sekarang)

      // --- A. PROSES BARANG MASUK (RETURN) ---
      const returnItemsToInsert: CustomerReturnItemType[] = [];
      const stockMutationsToInsert: InsertStockMutationType[] = [];

      for (const rItem of returnedItems) {
        // Cek apakah item benar-benar ada di invoice asli
        const originalSaleItem = existingSale.items.find(
          (i) =>
            i.productId === rItem.productId && i.variantId === rItem.variantId,
        );

        if (!originalSaleItem) {
          throw new Error(
            `Item (ID Varian: ${rItem.variantId}) tidak ditemukan pada invoice asli.`,
          );
        }

        // Hitung akumulasi retur sebelumnya untuk item ini
        const previouslyReturnedQty = existingSale.customerReturns.reduce(
          (sum, ret) => {
            const itemMatch = ret.items.find(
              (i) => i.variantId === rItem.variantId,
            );
            return sum + (itemMatch ? Number(itemMatch.qty) : 0);
          },
          0,
        );

        const remainingQty =
          Number(originalSaleItem.qty) - previouslyReturnedQty;

        // Cek kuantitas retur vs sisa yang bisa diretur
        if (Number(rItem.qty) > remainingQty) {
          throw new Error(
            `Jumlah retur (${rItem.qty}) melebihi sisa pembelian (${remainingQty}) untuk item ID ${rItem.variantId}`,
          );
        }

        // Ambil data varian untuk konversi unit
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, rItem.variantId),
        });
        if (!variantData) throw new Error("Varian produk tidak valid");

        // Hitung Nilai Uang: Menggunakan 'priceAtSale' (Harga dulu, sesuai yang customer bayar)
        const value = Number(rItem.qty) * Number(originalSaleItem.priceAtSale);
        totalValueReturned += value;

        // Tambah Stok Gudang (Restock)
        const qtyInBase =
          Number(rItem.qty) * Number(variantData.conversionToBase);

        if (rItem.returnedToStock) {
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${qtyInBase.toFixed(3)}`,
            })
            .where(eq(products.id, rItem.productId));
        }

        // Siapkan Data Insert DB
        returnItemsToInsert.push({
          productId: rItem.productId,
          variantId: rItem.variantId,
          qty: rItem.qty.toString(),
          priceAtReturn: originalSaleItem.priceAtSale.toString(),
          unitFactorAtReturn: variantData.conversionToBase.toString(),
          reason: rItem.reason || "Customer Return",
          returnedToStock: rItem.returnedToStock,
          userId,
          returnId: 0,
        });
        if (rItem.returnedToStock) {
          stockMutationsToInsert.push({
            productId: rItem.productId,
            variantId: rItem.variantId,
            type: "return_restock",
            qtyBaseUnit: qtyInBase.toFixed(4),
            unitFactorAtMutation: variantData.conversionToBase,
            reference: returnNumber,
            userId,
          });
        }
      }

      // --- B. PROSES BARANG KELUAR (EXCHANGE) ---
      const exchangeItemsToInsert: CustomerReturnExchangeItemType[] = [];

      if (compensationType === "exchange") {
        // Wajib ada barang pengganti jika tipe exchange
        if (!exchangeItems || exchangeItems.length === 0) {
          throw new Error(
            "Tipe 'exchange' wajib menyertakan barang pengganti.",
          );
        }

        for (const eItem of exchangeItems) {
          const productData = await tx.query.products.findFirst({
            where: eq(products.id, eItem.productId),
          });
          const variantData = await tx.query.productVariants.findFirst({
            where: eq(productVariants.id, eItem.variantId),
          });

          if (!productData || !variantData)
            throw new Error(
              `Barang pengganti ID ${eItem.variantId} tidak ditemukan`,
            );

          const qtyInBase =
            Number(eItem.qty) * Number(variantData.conversionToBase);

          // Cek Stok Gudang Barang Pengganti
          if (Number(productData.stock) < qtyInBase) {
            throw new Error(
              `Stok barang pengganti ${productData.name} tidak cukup`,
            );
          }

          // Kurangi Stok Gudang
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} - ${qtyInBase.toFixed(3)}` })
            .where(eq(products.id, eItem.productId));

          // Hitung Nilai Uang: Menggunakan 'sellPrice' (Harga SEKARANG)
          const value = Number(eItem.qty) * Number(variantData.sellPrice);
          totalValueExchange += value;

          exchangeItemsToInsert.push({
            productId: eItem.productId,
            variantId: eItem.variantId,
            unitFactorAtExchange: variantData.conversionToBase.toString(),
            priceAtExchange: variantData.sellPrice.toString(),
            qty: eItem.qty.toString(),
            returnId: 0,
          });

          stockMutationsToInsert.push({
            productId: eItem.productId,
            variantId: eItem.variantId,
            type: "exchange",
            qtyBaseUnit: (-qtyInBase).toFixed(4),
            unitFactorAtMutation: variantData.conversionToBase,
            reference: returnNumber,
            userId,
          });
        }
      } else {
        // Jika bukan exchange, pastikan frontend tidak mengirim exchangeItems
        if (exchangeItems && exchangeItems.length > 0) {
          throw new Error(
            "Item pengganti hanya boleh diisi jika tipe kompensasi adalah 'exchange'",
          );
        }
      }

      // --- C. HITUNG NILAI KEUANGAN ---
      //
      // totalValueReturned : Nilai bruto barang yang dikembalikan customer
      // totalValueExchange  : Nilai bruto barang pengganti yang diterima customer
      //
      // Untuk REFUND      : totalRefund = totalValueReturned (kembali penuh ke customer secara tunai)
      // Untuk CREDIT NOTE : totalRefund = totalValueReturned (masuk saldo penuh ke customer)
      // Untuk EXCHANGE    : totalRefund = totalValueReturned - totalValueExchange
      //                      > 0 : ada sisa (bisa dikembalikan tunai atau masuk saldo)
      //                      = 0 : impas, tidak ada transaksi keuangan tambahan
      //                      < 0 : customer harus bayar kekurangan (tagih ke customer)

      let totalRefund: number;

      if (compensationType === "exchange") {
        totalRefund = totalValueReturned - totalValueExchange; // Bisa 0, positif, atau negatif
      } else {
        // refund & credit_note: customer menerima kembali seluruh nilai barang yang diretur
        totalRefund = totalValueReturned;
      }

      // surplusStrategy hanya relevan untuk exchange dengan sisa positif
      const finalSurplusStrategy =
        compensationType === "exchange" && totalRefund > 0
          ? surplusStrategy || "cash"
          : null;

      // --- D. EKSEKUSI KEUANGAN (Balance Update) ---

      // Flag apakah ada mutasi saldo yang disisipkan
      let didInsertBalanceMutation = false;

      if (compensationType === "credit_note") {
        // Seluruh nilai barang masuk ke saldo pelanggan
        if (!finalCustomerId) {
          throw new Error(
            "Credit Note hanya bisa diproses untuk customer terdaftar.",
          );
        }
        const customerData = await tx.query.customers.findFirst({
          where: eq(customers.id, Number(finalCustomerId)),
        });
        if (!customerData) throw new Error("Data customer tidak ditemukan");

        const balanceBefore = Number(customerData.creditBalance);
        const balanceAfter = balanceBefore + totalRefund;

        await tx
          .update(customers)
          .set({ creditBalance: balanceAfter.toFixed(2) })
          .where(eq(customers.id, Number(finalCustomerId)));

        await tx.insert(customerBalanceMutations).values({
          customerId: Number(finalCustomerId),
          amount: totalRefund.toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          type: "return_deposit",
          referenceId: 0, // Diupdate setelah header return diinsert
        });
        didInsertBalanceMutation = true;
      } else if (
        compensationType === "exchange" &&
        totalRefund > 0 &&
        finalSurplusStrategy === "credit_balance"
      ) {
        // Ada sisa uang exchange yang diminta masuk ke saldo
        if (!finalCustomerId) {
          throw new Error(
            "Saldo pelanggan tidak bisa diupdate tanpa data customer.",
          );
        }
        const customerData = await tx.query.customers.findFirst({
          where: eq(customers.id, Number(finalCustomerId)),
        });
        if (!customerData) throw new Error("Data customer tidak ditemukan");

        const balanceBefore = Number(customerData.creditBalance);
        const balanceAfter = balanceBefore + totalRefund;

        await tx
          .update(customers)
          .set({ creditBalance: balanceAfter.toFixed(2) })
          .where(eq(customers.id, Number(finalCustomerId)));

        await tx.insert(customerBalanceMutations).values({
          customerId: Number(finalCustomerId),
          amount: totalRefund.toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          type: "exchange_surplus",
          referenceId: 0, // Diupdate setelah header return diinsert
        });
        didInsertBalanceMutation = true;
      }
      // Skenario lainnya (refund tunai, exchange impas, exchange tagih ke customer, exchange sisa cash):
      // Tidak ada perubahan saldo — kasir yang handle secara fisik.

      // --- E. INSERT DATABASE ---

      // 1. Insert Header Return
      const [newReturn] = await tx
        .insert(customerReturns)
        .values({
          returnNumber,
          saleId,
          customerId: finalCustomerId || null,
          totalRefund: totalRefund.toFixed(2),
          totalValueReturned: totalValueReturned.toFixed(2),
          compensationType,
          surplusStrategy: finalSurplusStrategy,
          userId,
        })
        .returning();

      // 2. Insert Detail Return Items
      if (returnItemsToInsert.length > 0) {
        await tx.insert(customerReturnItems).values(
          returnItemsToInsert.map((i) => ({
            ...i,
            returnId: newReturn.id,
          })),
        );
      }

      // 3. Insert Detail Exchange Items
      if (exchangeItemsToInsert.length > 0) {
        await tx.insert(customerExchangeItems).values(
          exchangeItemsToInsert.map((i) => ({
            ...i,
            returnId: newReturn.id,
          })),
        );
      }

      // 4. Insert Mutasi Stok
      if (stockMutationsToInsert.length > 0) {
        await tx
          .insert(stockMutations)
          .values(stockMutationsToInsert as InsertStockMutationType[]);
      }

      // 5. Update referenceId di customerBalanceMutations (hanya jika ada mutasi yang disisipkan)
      if (didInsertBalanceMutation && finalCustomerId) {
        const mutationType =
          compensationType === "credit_note"
            ? "return_deposit"
            : "exchange_surplus";

        await tx
          .update(customerBalanceMutations)
          .set({ referenceId: newReturn.id })
          .where(
            and(
              eq(customerBalanceMutations.customerId, Number(finalCustomerId)),
              eq(customerBalanceMutations.referenceId, 0),
              eq(customerBalanceMutations.type, mutationType),
            ),
          );
      }

      // --- F. RETURN RESPONSE MESSAGES ---
      let message = "";
      const formattedTotalReturn = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(totalValueReturned);
      const formattedRefund = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(Math.abs(totalRefund));

      if (compensationType === "credit_note") {
        message = `Retur sukses. Saldo sebesar ${formattedTotalReturn} ditambahkan ke akun pelanggan.`;
      } else if (compensationType === "refund") {
        message = `Retur sukses. Berikan uang tunai ${formattedTotalReturn} kepada pelanggan.`;
      } else if (compensationType === "exchange") {
        if (totalRefund > 0) {
          if (finalSurplusStrategy === "credit_balance") {
            message = `Tukar barang sukses. Sisa ${formattedRefund} ditambahkan ke saldo pelanggan.`;
          } else {
            message = `Tukar barang sukses. Kembalikan sisa uang tunai ${formattedRefund} ke pelanggan.`;
          }
        } else if (totalRefund < 0) {
          message = `Tukar barang sukses. Tagih kekurangan ${formattedRefund} dari pelanggan.`;
        } else {
          message = `Tukar barang sukses. Nilai barang impas, tidak ada uang kembali.`;
        }
      }

      return {
        returnHeader: newReturn,
        netChange: totalRefund,
        totalValueReturned,
        message,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
