import { db } from "@/lib/db";
import {
  formatMeta,
  getSearchAndOrderBasic,
  parsePagination,
} from "@/lib/query-helper";
import { and, eq, sql } from "drizzle-orm";
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
import {
  insertCustomerExchangeItemType,
  insertCustomerReturnItemType,
  validateInsertCustomerReturnData,
} from "@/lib/validations/customer-return";
import { handleApiError } from "@/lib/api-utils";
import { InsertStockMutationType } from "@/drizzle/type";

// GET all customer-returns with search
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      customerReturns.returnNumber,
    );

    const [customerReturnsData, totalRes] = await Promise.all([
      db.query.customerReturns.findMany({
        where: and(eq(customerReturns.isArchived, false), searchFilter),
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
        with: {
          customer: true,
          sales: true,
        },
      }),
      db
        .select({ count: sql<number>`count(*)` })
        .from(customerReturns)
        .where(and(eq(customerReturns.isArchived, false), searchFilter)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: customerReturnsData,
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
      userId,
      items: returnedItems, // Array barang yang dikembalikan
      exchangeItems, // Array barang pengganti (opsional)
      compensationType, // 'refund' | 'credit_note' | 'exchange'
    } = validation;

    const result = await db.transaction(async (tx) => {
      // 1. Ambil Data Penjualan Asal
      const existingSale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
        with: { items: true },
      });

      if (!existingSale) throw new Error("Data penjualan tidak ditemukan");
      if (existingSale.isArchived)
        throw new Error("Penjualan ini sudah dibatalkan/archived");

      const returnNumber = `RET-${Date.now()}`;

      // Variable penampung nilai uang
      let totalValueReturned = 0; // Nilai barang yang dikembalikan (Harga BELI dulu)
      let totalValueExchange = 0; // Nilai barang pengganti (Harga JUAL sekarang)

      // --- A. PROSES BARANG MASUK (RETURN) ---
      const returnItemsToInsert: insertCustomerReturnItemType[] = [];
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

        // Cek kuantitas retur vs beli
        if (Number(rItem.qty) > Number(originalSaleItem.qty)) {
          throw new Error(
            `Jumlah retur melebihi jumlah pembelian untuk item ID ${rItem.variantId}`,
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
          qty: rItem.qty,
          priceAtReturn: originalSaleItem.priceAtSale,
          unitFactorAtReturn: variantData.conversionToBase,
          reason: rItem.reason || "Customer Return",
          returnedToStock: rItem.returnedToStock,
          userId,
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
      const exchangeItemsToInsert: insertCustomerExchangeItemType[] = [];

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
            unitFactorAtExchange: variantData.conversionToBase,
            priceAtExchange: variantData.sellPrice,
            qty: eItem.qty,
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
            .where(eq(customers.id, Number(existingSale.customerId)));
        }

        if (!existingSale.customerId) {
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
          .where(eq(customers.id, Number(existingSale.customerId)));
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
          customerId: existingSale.customerId || null, // Nullable di schema jika ada

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
            qty: i.qty.toString(),
            returnId: newReturn.id,
          })),
        );
      }

      // 3. Insert Detail Exchange Items
      if (exchangeItemsToInsert.length > 0) {
        await tx.insert(customerExchangeItems).values(
          exchangeItemsToInsert.map((i) => ({
            ...i,
            qty: i.qty.toString(),
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
