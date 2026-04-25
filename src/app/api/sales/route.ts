import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  sales,
  saleItems,
  products,
  stockMutations,
  productVariants,
  customers,
  debts,
  customerReturns,
  customerBalanceMutations,
} from "@/drizzle/schema";
import { and, eq, not, sql } from "drizzle-orm";
import { validateInsertSaleData } from "@/lib/validations/sale";
import {
  parsePagination,
  getSearchAndOrderBasic,
  formatMeta,
} from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";
import {
  MS_DAY,
  getLocalMidnightUtc,
  normalizeTimezone,
} from "@/lib/timezone";
import { processDebtPayment } from "../debts/_lib/debt-service";
import { SaleStatusEnumType } from "@/drizzle/type";
import { createPakasirQris } from "@/lib/pakasir";

// GET all sales with search and filters
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");
    const status = searchParams.get("status");
    const customerId = searchParams.get("customerId");

    const { searchFilter, searchOrder } = getSearchAndOrderBasic(
      params.search,
      params.order,
      params.orderBy,
      sales.invoiceNumber,
    );

    let filter = and(searchFilter, not(sales.isArchived));

    if (startDate) {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      filter = and(filter, sql`${sales.createdAt} >= ${start}`);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filter = and(filter, sql`${sales.createdAt} <= ${end}`);
    }
    if (status) {
      filter = and(filter, eq(sales.status, status as SaleStatusEnumType));
    }
    if (customerId) {
      filter = and(filter, eq(sales.customerId, Number(customerId)));
    }

    const timezoneParam = searchParams.get("timezone");
    const timezone = normalizeTimezone(timezoneParam ?? undefined);
    const todayStart = getLocalMidnightUtc(timezone);
    const todayEnd = new Date(todayStart.getTime() + MS_DAY - 1);
    const yesterdayStart = new Date(todayStart.getTime() - MS_DAY);
    const yesterdayEnd = new Date(todayStart.getTime() - 1);

    const [
      salesData,
      totalRes,
      todayAnalytics,
      yesterdayAnalytics,
      lifetimeRes,
    ] = await Promise.all([
      db.query.sales.findMany({
        where: filter,
        with: {
          user: { columns: { id: true, name: true } },
          debt: {
            columns: {
              id: true,
              originalAmount: true,
              remainingAmount: true,
              status: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          customer: { columns: { id: true, name: true, creditBalance: true } },
          items: {
            columns: {
              id: true,
              qty: true,
              priceAtSale: true,
              costAtSale: true,
              subtotal: true,
            },
            with: {
              product: { columns: { id: true, name: true } },
              productVariant: { columns: { id: true, name: true } },
            },
          },
        },
        orderBy: searchOrder,
        limit: params.limit,
        offset: params.offset,
      }),

      db.select({ count: sql<number>`count(*)` }).from(sales).where(filter),

      Promise.all([
        db
          .select({
            totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
            count: sql<number>`count(*)`,
          })
          .from(sales)
          .where(
            and(
              not(sales.isArchived),
              not(eq(sales.status, "cancelled")),
              sql`${sales.createdAt} >= ${todayStart}`,
              sql`${sales.createdAt} <= ${todayEnd}`,
            ),
          ),
        db
          .select({
            netRevenue: sql<string>`coalesce(sum(${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})), 0)`,
          })
          .from(saleItems)
          .innerJoin(sales, eq(sales.id, saleItems.saleId))
          .where(
            and(
              not(sales.isArchived),
              not(eq(sales.status, "cancelled")),
              sql`${sales.createdAt} >= ${todayStart}`,
              sql`${sales.createdAt} <= ${todayEnd}`,
            ),
          ),
        db
          .select({
            totalDebt: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)`,
          })
          .from(debts)
          .where(
            and(
              eq(debts.isActive, true),
              sql`${debts.createdAt} >= ${todayStart}`,
              sql`${debts.createdAt} <= ${todayEnd}`,
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(customerReturns)
          .where(
            and(
              not(customerReturns.isArchived),
              sql`${customerReturns.createdAt} >= ${todayStart}`,
              sql`${customerReturns.createdAt} <= ${todayEnd}`,
            ),
          ),
      ]),

      Promise.all([
        db
          .select({
            totalSales: sql<string>`coalesce(sum(${sales.totalPrice}), 0)`,
            count: sql<number>`count(*)`,
          })
          .from(sales)
          .where(
            and(
              not(sales.isArchived),
              not(eq(sales.status, "cancelled")),
              sql`${sales.createdAt} >= ${yesterdayStart}`,
              sql`${sales.createdAt} <= ${yesterdayEnd}`,
            ),
          ),
        db
          .select({
            netRevenue: sql<string>`coalesce(sum(${saleItems.subtotal} - (${saleItems.costAtSale} * ${saleItems.qty} * ${saleItems.unitFactorAtSale})), 0)`,
          })
          .from(saleItems)
          .innerJoin(sales, eq(sales.id, saleItems.saleId))
          .where(
            and(
              not(sales.isArchived),
              not(eq(sales.status, "cancelled")),
              sql`${sales.createdAt} >= ${yesterdayStart}`,
              sql`${sales.createdAt} <= ${yesterdayEnd}`,
            ),
          ),
        db
          .select({
            totalDebt: sql<string>`coalesce(sum(${debts.remainingAmount}), 0)`,
          })
          .from(debts)
          .where(
            and(
              eq(debts.isActive, true),
              sql`${debts.createdAt} >= ${yesterdayStart}`,
              sql`${debts.createdAt} <= ${yesterdayEnd}`,
            ),
          ),
        db
          .select({ count: sql<number>`count(*)` })
          .from(customerReturns)
          .where(
            and(
              not(customerReturns.isArchived),
              sql`${customerReturns.createdAt} >= ${yesterdayStart}`,
              sql`${customerReturns.createdAt} <= ${yesterdayEnd}`,
            ),
          ),
      ]),

      db
        .select({ count: sql<number>`count(*)` })
        .from(sales)
        .where(not(sales.isArchived)),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);
    const lifetimeCount = Number(lifetimeRes[0]?.count || 0);

    const [todaySalesData, todayNetRes, todayDebtRes, todayReturnRes] = todayAnalytics;
    const todaySales = Number(todaySalesData[0]?.totalSales || 0);
    const todayNet = Number(todayNetRes[0]?.netRevenue || 0);
    const todayDebt = Number(todayDebtRes[0]?.totalDebt || 0);
    const todayActivity =
      Number(todaySalesData[0]?.count || 0) + Number(todayReturnRes[0]?.count || 0);

    const [yesterdaySalesData, yesterdayNetRes, yesterdayDebtRes, yesterdayReturnRes] = yesterdayAnalytics;
    const yesterdaySales = Number(yesterdaySalesData[0]?.totalSales || 0);
    const yesterdayNet = Number(yesterdayNetRes[0]?.netRevenue || 0);
    const yesterdayDebt = Number(yesterdayDebtRes[0]?.totalDebt || 0);
    const yesterdayActivity =
      Number(yesterdaySalesData[0]?.count || 0) + Number(yesterdayReturnRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: salesData,
      analytics: {
        totalSalesToday: todaySales,
        totalSalesYesterday: yesterdaySales,
        netRevenueToday: todayNet,
        netRevenueYesterday: yesterdayNet,
        piutangToday: todayDebt,
        piutangYesterday: yesterdayDebt,
        transactionsTodayCount: todayActivity,
        transactionsYesterdayCount: yesterdayActivity,
        totalTransactionsLifetime: lifetimeCount,
      },
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = await validateInsertSaleData(body);
    const {
      userId,
      customerId,
      items,
      totalPaid,
      totalBalanceUsed,
      isDebt,
      shouldPayOldDebt,
      paymentMethod, // ✅ BARU: "cash" | "qris"
    } = validation;

    // Validasi: QRIS tidak bisa hutang
    if (paymentMethod === "qris" && isDebt) {
      return NextResponse.json(
        { success: false, error: "Pembayaran QRIS tidak dapat dicatat sebagai hutang" },
        { status: 400 },
      );
    }

    // Cek Duplikat Variant
    const variantIds = items.map((i) => i.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      return NextResponse.json(
        { success: false, error: "Terdapat item duplikat, silahkan digabung kuantitasnya" },
        { status: 400 },
      );
    }

    if (!customerId && totalBalanceUsed > 0) {
      return NextResponse.json(
        { success: false, error: "Customer tidak ditemukan" },
        { status: 404 },
      );
    }

    if (customerId) {
      const customerData = await db.query.customers.findFirst({
        where: eq(customers.id, customerId),
      });
      if (!customerData) {
        return NextResponse.json(
          { success: false, error: "Customer tidak ditemukan" },
          { status: 404 },
        );
      }
      if (Number(customerData.creditBalance) < totalBalanceUsed) {
        return NextResponse.json(
          { success: false, error: "Saldo tidak mencukupi" },
          { status: 400 },
        );
      }
    }

    if (isDebt && !customerId) {
      return NextResponse.json(
        { success: false, error: "Hutang hanya diperbolehkan untuk member/customer terdaftar" },
        { status: 400 },
      );
    }

    // ✅ Untuk QRIS: status awal adalah pending_payment
    const initialStatus = paymentMethod === "qris" ? "pending_payment" : "completed";

    const result = await db.transaction(async (tx) => {
      const invoiceNum = `INV-${Date.now()}`;

      const [newSale] = await tx
        .insert(sales)
        .values({
          invoiceNumber: invoiceNum,
          totalPrice: "0",
          // ✅ QRIS: totalPaid = 0 dulu, akan diupdate setelah webhook
          totalPaid: paymentMethod === "qris" ? "0" : totalPaid.toString(),
          totalReturn: "0",
          totalBalanceUsed: totalBalanceUsed.toString(),
          userId,
          customerId,
          paymentMethod: paymentMethod ?? "cash",
          status: initialStatus,
        })
        .returning();

      let grandTotal = 0;

      for (const item of items) {
        const productData = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!productData || !variantData) throw new Error("Produk tidak ditemukan");

        const conversion = Number(variantData.conversionToBase);
        const qtyInBaseUnit = Number(item.qty) * conversion;
        const currentStock = Number(productData.stock);

        if (currentStock < qtyInBaseUnit) {
          throw new Error(`Stok tidak mencukupi untuk produk: ${productData.name}`);
        }

        const subtotal = Number(item.qty) * Number(variantData.sellPrice);
        grandTotal += subtotal;

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${qtyInBaseUnit.toFixed(3)}`,
            updatedAt: new Date()
          })
          .where(eq(products.id, item.productId));

        await tx.insert(saleItems).values({
          saleId: newSale.id,
          productId: item.productId,
          variantId: item.variantId,
          qty: item.qty.toFixed(3),
          priceAtSale: variantData.sellPrice,
          unitFactorAtSale: variantData.conversionToBase,
          costAtSale: Number(productData.averageCost).toFixed(4),
          subtotal: subtotal.toFixed(2),
        });

        await tx.insert(stockMutations).values({
          productId: item.productId,
          variantId: item.variantId,
          type: "sale",
          qtyBaseUnit: (-qtyInBaseUnit).toFixed(4),
          unitFactorAtMutation: variantData.conversionToBase,
          reference: `INV-${newSale.id.toString().padStart(7, "0")}`,
          userId,
        });
      }

      if (totalBalanceUsed > grandTotal) {
        throw new Error("Penggunaan saldo tidak boleh melebihi total belanja");
      }

      const netTotal = grandTotal - totalBalanceUsed;

      // ✅ Validasi nominal minimal QRIS (Pakasir mengharuskan min Rp 500)
      if (paymentMethod === "qris" && netTotal < 500) {
        throw new Error(
          `Nominal pembayaran QRIS minimal adalah Rp 500. Total saat ini: ${new Intl.NumberFormat(
            "id-ID",
            { style: "currency", currency: "IDR" },
          ).format(netTotal)}`,
        );
      }

      const paidAmount = paymentMethod === "qris" ? netTotal : Number(totalPaid);
      let calculatedReturn = 0;
      let saleStatus: "completed" | "debt" | "pending_payment" = initialStatus;

      // ✅ QRIS: lewati validasi pembayaran kurang karena pembayaran belum terjadi
      if (paymentMethod !== "qris") {
        if (paidAmount < netTotal) {
          if (!isDebt) {
            throw new Error(
              `Pembayaran kurang! Total: ${new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(netTotal)}, Dibayar: ${new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
              }).format(paidAmount)}`,
            );
          }

          saleStatus = "debt";
          const debtAmount = netTotal - paidAmount;

          await tx.insert(debts).values({
            saleId: newSale.id,
            customerId: customerId!,
            originalAmount: debtAmount.toFixed(2),
            remainingAmount: debtAmount.toFixed(2),
            status: "unpaid",
          });
        } else {
          calculatedReturn = paidAmount - netTotal;
        }
      }

      if (customerId && totalBalanceUsed > 0) {
        const customerBefore = await tx.query.customers.findFirst({
          where: eq(customers.id, customerId),
        });

        const balanceBefore = Number(customerBefore!.creditBalance);
        const balanceAfter = balanceBefore - totalBalanceUsed;

        await tx
          .update(customers)
          .set({
            creditBalance: sql`${customers.creditBalance} - ${totalBalanceUsed.toFixed(2)}`,
          })
          .where(eq(customers.id, customerId));

        await tx.insert(customerBalanceMutations).values({
          customerId: customerId,
          amount: (-totalBalanceUsed).toFixed(2),
          balanceBefore: balanceBefore.toFixed(2),
          balanceAfter: balanceAfter.toFixed(2),
          type: "sale_balance_used",
          referenceId: newSale.id,
        });
      }

      // Gunakan prefix tanggal (YYYYMMDD) + ID agar unik di Pakasir (mencegah collision jika DB reset/dev)
      const datePrefix = new Date()
        .toISOString()
        .slice(0, 10)
        .replace(/-/g, "");
      const finalInvoice = `INV-${datePrefix}-${newSale.id.toString().padStart(7, "0")}`;
      let finalReturn = calculatedReturn;

      // Bayar hutang lama dari surplus (hanya untuk pembayaran cash)
      if (paymentMethod !== "qris" && shouldPayOldDebt && finalReturn > 0 && customerId) {
        let remainingSurplus = finalReturn;

        const activeDebts = await tx.query.debts.findMany({
          where: and(
            eq(debts.customerId, customerId),
            not(eq(debts.status, "paid")),
            eq(debts.isActive, true),
          ),
          orderBy: (debts, { asc }) => [asc(debts.createdAt)],
        });

        for (const debt of activeDebts) {
          if (remainingSurplus <= 0) break;

          const currentRemaining = Number(debt.remainingAmount);
          const payAmount = Math.min(currentRemaining, remainingSurplus);

          await processDebtPayment(
            tx,
            debt.id,
            payAmount,
            `Dibayar otomatis dari kembalian transaksi ${finalInvoice}`,
          );

          remainingSurplus -= payAmount;
        }

        finalReturn = remainingSurplus;
      }

      await tx
        .update(sales)
        .set({
          totalPrice: grandTotal.toFixed(2),
          totalReturn: finalReturn.toFixed(2),
          invoiceNumber: finalInvoice,
          status: saleStatus,
          // ✅ Simpan invoice sebagai qrisOrderId untuk lookup saat webhook
          ...(paymentMethod === "qris" && {
            qrisOrderId: finalInvoice,
          }),
        })
        .where(eq(sales.id, newSale.id));

      return {
        id: newSale.id,
        grandTotal,
        netTotal,
        finalInvoice,
      };
    });

    // Fetch full sale data
    const fullSale = await db.query.sales.findFirst({
      where: eq(sales.id, result.id),
      with: {
        customer: true,
        user: { columns: { id: true, name: true } },
        debt: {
          columns: {
            id: true,
            originalAmount: true,
            remainingAmount: true,
            status: true,
            createdAt: true,
            updatedAt: true,
          },
        },
        items: {
          with: {
            product: { columns: { id: true, name: true } },
            productVariant: { columns: { id: true, name: true, sku: true } },
          },
        },
      },
    });

    if (paymentMethod === "qris") {
      const qrisAmount = result.netTotal; // amount setelah dikurangi balance/voucher

      try {
        console.log(`[QRIS_DEBUG] Creating QRIS for ${result.finalInvoice}:`, {
          qrisAmount,
          grandTotal: result.grandTotal,
          balanceUsed: totalBalanceUsed,
        });

        const pakasirRes = await createPakasirQris(result.finalInvoice, qrisAmount);

        // Simpan QR string dan expiry ke database
        await db
          .update(sales)
          .set({
            qrisPaymentNumber: pakasirRes.payment.payment_number,
            qrisExpiredAt: new Date(pakasirRes.payment.expired_at),
          })
          .where(eq(sales.id, result.id));

        return NextResponse.json({
          success: true,
          data: {
            ...fullSale,
            // Sertakan qrisData untuk ditampilkan di frontend
            qrisData: {
              paymentNumber: pakasirRes.payment.payment_number,
              expiredAt: pakasirRes.payment.expired_at,
              totalPayment: pakasirRes.payment.total_payment,
              fee: pakasirRes.payment.fee,
            },
          },
        });
      } catch (pakasirError) {
        // Jika Pakasir gagal, batalkan sale (rollback stok)
        console.error("Pakasir QRIS creation failed:", pakasirError);

        // Revert sale
        await db
          .update(sales)
          .set({ isArchived: true, status: "cancelled", deletedAt: new Date() })
          .where(eq(sales.id, result.id));

        // Revert stok
        const saleItemsData = await db
          .select()
          .from(saleItems)
          .where(eq(saleItems.saleId, result.id));

        for (const item of saleItemsData) {
          const variantData = await db.query.productVariants.findFirst({
            where: eq(productVariants.id, item.variantId),
          });
          if (variantData) {
            const qtyToRevert = Number(item.qty) * Number(variantData.conversionToBase);
            await db
              .update(products)
              .set({ stock: sql`${products.stock} + ${qtyToRevert.toFixed(3)}` })
              .where(eq(products.id, item.productId));
          }
        }

        return NextResponse.json(
          { success: false, error: "Gagal membuat pembayaran QRIS. Silakan coba lagi." },
          { status: 502 },
        );
      }
    }

    return NextResponse.json({ success: true, data: fullSale });
  } catch (error) {
    return handleApiError(error);
  }
}
