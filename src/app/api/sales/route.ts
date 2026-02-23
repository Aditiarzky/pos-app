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
} from "@/drizzle/schema";
import { and, eq, not, sql } from "drizzle-orm";
import { validateInsertSaleData } from "@/lib/validations/sale";
import {
  parsePagination,
  getSearchAndOrderBasic,
  formatMeta,
} from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";
import { processDebtPayment } from "../debts/_lib/debt-service";
import { SaleStatusEnumType } from "@/drizzle/type";

// GET all sales with search and filters
export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);

    // Advanced Filters
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

    const now = new Date();
    const startOfToday = new Date(now.setHours(0, 0, 0, 0));

    const [salesData, totalRes, todayAnalyticsRes, lifetimeRes] =
      await Promise.all([
        db.query.sales.findMany({
          where: filter,
          with: {
            user: {
              columns: {
                id: true,
                name: true,
              },
            },
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
            customer: {
              columns: {
                id: true,
                name: true,
                creditBalance: true,
              },
            },
            items: {
              columns: {
                id: true,
                qty: true,
                priceAtSale: true,
                costAtSale: true,
                subtotal: true,
              },
              with: {
                product: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
                productVariant: {
                  columns: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
          orderBy: searchOrder,
          limit: params.limit,
          offset: params.offset,
        }),

        db
          .select({ count: sql<number>`count(*)` })
          .from(sales)
          .where(filter),

        db
          .select({
            totalSales: sql<string>`sum(${sales.totalPrice})`,
            totalPaid: sql<string>`sum(${sales.totalPaid})`,
            count: sql<number>`count(*)`,
          })
          .from(sales)
          .where(
            and(
              not(sales.isArchived),
              sql`${sales.createdAt} >= ${startOfToday}`,
            ),
          ),

        db
          .select({ count: sql<number>`count(*)` })
          .from(sales)
          .where(not(sales.isArchived)),
      ]);

    const totalCount = Number(totalRes[0]?.count || 0);
    const todaySales = Number(todayAnalyticsRes[0]?.totalSales || 0);
    const todayPaid = Number(todayAnalyticsRes[0]?.totalPaid || 0);
    const todayCount = Number(todayAnalyticsRes[0]?.count || 0);
    const lifetimeCount = Number(lifetimeRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: salesData,
      analytics: {
        totalSalesToday: todaySales,
        transactionsTodayCount: todayCount,
        totalReceivedToday: todayPaid,
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
    } = validation;

    // Cek Duplikat Variant dalam satu keranjang
    const variantIds = items.map((i) => i.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Terdapat item duplikat, silahkan digabung kuantitasnya",
        },
        { status: 400 },
      );
    }

    if (!customerId && totalBalanceUsed > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Customer tidak ditemukan",
        },
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
        {
          success: false,
          error: "Hutang hanya diperbolehkan untuk member/customer terdaftar",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const invoiceNum = `INV-${Date.now()}`;

      const [newSale] = await tx
        .insert(sales)
        .values({
          invoiceNumber: invoiceNum,
          totalPrice: "0",
          totalPaid: totalPaid.toString(),
          totalReturn: "0",
          totalBalanceUsed: totalBalanceUsed.toString(),
          userId,
          customerId,
          status: "completed",
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

        if (!productData || !variantData)
          throw new Error("Produk tidak ditemukan");

        const conversion = Number(variantData.conversionToBase);
        const qtyInBaseUnit = Number(item.qty) * conversion;
        const currentStock = Number(productData.stock);

        if (currentStock < qtyInBaseUnit) {
          throw new Error(
            `Stok tidak mencukupi untuk produk: ${productData.name}`,
          );
        }

        const subtotal = Number(item.qty) * Number(variantData.sellPrice);
        grandTotal += subtotal;

        await tx
          .update(products)
          .set({
            stock: sql`${products.stock} - ${qtyInBaseUnit.toFixed(3)}`,
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
      const paidAmount = Number(totalPaid);
      let calculatedReturn = 0;
      let saleStatus: "completed" | "debt" = "completed";

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

      if (customerId && totalBalanceUsed > 0) {
        await tx
          .update(customers)
          .set({
            creditBalance: sql`${customers.creditBalance} - ${totalBalanceUsed.toFixed(2)}`,
          })
          .where(eq(customers.id, customerId));
      }

      const finalInvoice = `INV-${newSale.id.toString().padStart(7, "0")}`;
      let finalReturn = calculatedReturn;

      // --- Handle Old Debt Repayment with Surplus (Calculated Return) ---
      if (shouldPayOldDebt && finalReturn > 0 && customerId) {
        let remainingSurplus = finalReturn;

        // Get active debts for this customer, FIFO (oldest first)
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
        })
        .where(eq(sales.id, newSale.id));

      return {
        id: newSale.id,
      };
    });

    // Fetch full sale data with relations for receipt
    const fullSale = await db.query.sales.findFirst({
      where: eq(sales.id, result.id),
      with: {
        customer: true,
        user: {
          columns: {
            id: true,
            name: true,
          },
        },
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
            product: {
              columns: {
                id: true,
                name: true,
              },
            },
            productVariant: {
              columns: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, data: fullSale });
  } catch (error) {
    return handleApiError(error);
  }
}
