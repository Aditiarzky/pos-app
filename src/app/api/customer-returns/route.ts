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
      let totalValueReturned = 0; // Nilai barang yang dikembalikan (Harga BELI dulu)
      let totalValueExchange = 0; // Nilai barang pengganti (Harga JUAL sekarang)

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

        // Hitung Nilai Uang: Menggunakan 'priceAtSale' (Harga dulu)
        // Agar customer mendapat nilai sesuai yang mereka bayar saat itu.
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
            type: rItem.returnedToStock ? "return_restock" : "waste",
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

      // --- C. HITUNG SELISIH & EKSEKUSI KEUANGAN ---

      // Rumus: Nilai Barang Masuk (Retur) - Nilai Barang Keluar (Exchange)
      // Positif (+) : Toko hutang ke Customer (Harus Refund/Deposit)
      // Negatif (-) : Customer hutang ke Toko (Harus Bayar Kurangnya)
      const netRefundAmount = totalValueReturned - totalValueExchange;

      // Logic Keuangan Berdasarkan Tipe Kompensasi
      if (compensationType === "credit_note") {
        // Skenario: Masuk Saldo
        if (netRefundAmount < 0) {
          await tx
            .update(customers)
            .set({
              creditBalance: sql`${customers.creditBalance} - ${netRefundAmount.toFixed(2)}`,
            })
            .where(eq(customers.id, Number(finalCustomerId)));
        }

        if (!finalCustomerId) {
          throw new Error(
            "Transaksi tanpa data Customer tidak bisa dijadikan saldo (Credit Note).",
          );
        }

        // Update Saldo Customer
        await tx
          .update(customers)
          .set({
            creditBalance: sql`${customers.creditBalance} + ${netRefundAmount.toFixed(2)}`,
          })
          .where(eq(customers.id, Number(finalCustomerId)));
      }

      if (compensationType === "refund") {
        // Skenario: Uang Tunai Kembali
        // Tidak ada update saldo, uang dianggap keluar dari kasir (Cash Out)
        // netRefundAmount dicatat di table customerReturns sebagai record pengeluaran kas
        if (netRefundAmount < 0) {
          throw new Error(
            "Tidak bisa Refund jika customer harus menambah bayar.",
          );
        }
      }

      // --- D. INSERT DATABASE ---

      // 1. Insert Header Return
      const [newReturn] = await tx
        .insert(customerReturns)
        .values({
          returnNumber,
          saleId,
          customerId: finalCustomerId || null, // Nullable di schema jika ada

          // Penting:
          // Jika Positif: Toko keluar uang/saldo
          // Jika Negatif: Toko terima uang (Customer bayar kekurangan exchange)
          totalRefund: netRefundAmount.toFixed(2),

          compensationType,
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

      // --- E. RETURN RESPONSE MESSAGES ---
      let message = "";
      const formattedAmount = new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
      }).format(Math.abs(netRefundAmount));

      if (compensationType === "credit_note") {
        message = `Retur sukses. Saldo sebesar ${formattedAmount} ditambahkan ke akun pelanggan.`;
      } else if (compensationType === "refund") {
        message = `Retur sukses. Silahkan berikan uang tunai ${formattedAmount} kepada pelanggan.`;
      } else if (compensationType === "exchange") {
        if (netRefundAmount >= 0) {
          message = `Tukar barang sukses. Kembalikan sisa uang tunai ${formattedAmount} ke pelanggan.`;
        } else {
          message = `Tukar barang sukses. Tagih kekurangan pembayaran ${formattedAmount} dari pelanggan.`;
        }
      }

      return {
        returnHeader: newReturn,
        netChange: netRefundAmount,
        message,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
