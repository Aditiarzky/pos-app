import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { and, eq, not, sql } from "drizzle-orm";
import {
  sales,
  saleItems,
  products,
  stockMutations,
  productVariants,
  customers,
  debts,
} from "@/drizzle/schema";
import { validateInsertSaleData } from "@/lib/validations/sale";
import { handleApiError } from "@/lib/api-utils";
import { voidCustomerReturn } from "../../customer-returns/_lib/return-service";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ salesId: string }> },
) {
  try {
    const { salesId } = await params;
    const saleId = Number(salesId);

    if (isNaN(saleId)) {
      return NextResponse.json(
        { success: false, error: "salesId is required" },
        { status: 400 },
      );
    }

    const result = await db.query.sales.findFirst({
      where: and(eq(sales.id, saleId), not(sales.isArchived)),
      with: {
        items: {
          columns: {
            id: true,
            productId: true,
            variantId: true,
            qty: true,
            priceAtSale: true,
            costAtSale: true,
            unitFactorAtSale: true,
            subtotal: true,
          },
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                stock: true,
                averageCost: true,
              },
            },
            productVariant: {
              columns: {
                id: true,
                name: true,
                conversionToBase: true,
              },
            },
          },
        },
        customerReturns: {
          where: (customerReturns, { not }) => not(customerReturns.isArchived),
          columns: {
            id: true,
            compensationType: true,
            returnNumber: true,
            customerId: true,
            saleId: true,
            totalRefund: true,
            userId: true,
          },
          with: {
            items: {
              columns: {
                id: true,
                productId: true,
                variantId: true,
                qty: true,
                priceAtReturn: true,
                unitFactorAtReturn: true,
              },
            },
          },
        },
        customer: {
          columns: {
            id: true,
            name: true,
            creditBalance: true,
            phone: true,
            address: true,
          },
        },
      },
    });

    if (!result) {
      return NextResponse.json(
        { success: false, error: "sales not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

// sebaiknya tidak digunakan
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ salesId: string }> },
) {
  try {
    const { salesId } = await params;
    const saleId = Number(salesId);
    const body = await request.json();
    const validation = await validateInsertSaleData(body);
    const { userId, customerId, items: newItems, totalPaid } = validation;

    const variantIds = newItems.map((i) => i.variantId);
    if (new Set(variantIds).size !== variantIds.length) {
      return NextResponse.json(
        {
          success: false,
          error: "Terdapat item duplikat, silahkan digabung kuantitasnya",
        },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingSale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
      });
      if (!existingSale || existingSale.isArchived)
        throw new Error("Data tidak dapat diubah");

      const oldItems = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, saleId));
      for (const oldItem of oldItems) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, oldItem.variantId),
        });

        if (variant) {
          const qtyToRevert =
            Number(oldItem.qty) * Number(variant.conversionToBase);
          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${qtyToRevert.toFixed(3)}` })
            .where(eq(products.id, oldItem.productId));
        }
      }

      await tx.delete(saleItems).where(eq(saleItems.saleId, saleId));
      await tx
        .delete(stockMutations)
        .where(eq(stockMutations.reference, existingSale.invoiceNumber));

      let grandTotal = 0;
      const updatedItems = [];
      const updatedStockMutations = [];
      for (const item of newItems) {
        const productData = await tx.query.products.findFirst({
          where: eq(products.id, item.productId),
        });
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (!productData || !variantData)
          throw new Error("Produk tidak ditemukan");

        const qtyInBase =
          Number(item.qty) * Number(variantData.conversionToBase);

        if (Number(productData.stock) < qtyInBase)
          throw new Error(`Stok ${productData.name} tidak cukup`);

        const subtotal = Number(item.qty) * Number(variantData.sellPrice);
        grandTotal += subtotal;

        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${qtyInBase.toFixed(3)}` })
          .where(eq(products.id, item.productId));

        const [insertedItem] = await tx
          .insert(saleItems)
          .values({
            saleId,
            productId: item.productId,
            variantId: item.variantId,
            qty: item.qty.toFixed(3),
            priceAtSale: Number(variantData.sellPrice).toFixed(2),
            unitFactorAtSale: Number(variantData.conversionToBase).toFixed(3),
            costAtSale: Number(productData.averageCost).toFixed(2),
            subtotal: subtotal.toFixed(2),
          })
          .returning();

        updatedItems.push(insertedItem);

        const [insertedStockMutation] = await tx
          .insert(stockMutations)
          .values({
            productId: item.productId,
            variantId: item.variantId,
            type: "sale",
            qtyBaseUnit: (-qtyInBase).toFixed(4),
            reference: existingSale.invoiceNumber,
            userId,
          })
          .returning();

        updatedStockMutations.push(insertedStockMutation);
      }

      const paidAmount = Number(totalPaid);
      const calculatedReturn = paidAmount - grandTotal;
      if (paidAmount < grandTotal)
        throw new Error(
          `Pembayaran kurang! Total: ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(grandTotal)}, Dibayar: ${new Intl.NumberFormat("id-ID", {
            style: "currency",
            currency: "IDR",
          }).format(paidAmount)}`,
        );

      const [updatedSale] = await tx
        .update(sales)
        .set({
          userId,
          customerId,
          totalPrice: grandTotal.toFixed(2),
          totalPaid: totalPaid.toString(),
          totalReturn: calculatedReturn.toFixed(2),
        })
        .where(eq(sales.id, saleId))
        .returning();

      return {
        sale: updatedSale,
        items: updatedItems,
        stockMutations: updatedStockMutations,
      };
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ salesId: string }> },
) {
  try {
    const { salesId } = await params;
    const saleId = Number(salesId);

    if (isNaN(saleId)) {
      return NextResponse.json(
        { success: false, error: "ID tidak valid" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingSale = await tx.query.sales.findFirst({
        where: eq(sales.id, saleId),
        with: { customerReturns: true },
      });

      if (!existingSale) throw new Error("Penjualan tidak ditemukan");
      if (existingSale.isArchived)
        throw new Error("Penjualan sudah dibatalkan sebelumnya");

      const items = await tx
        .select()
        .from(saleItems)
        .where(eq(saleItems.saleId, saleId));

      for (const item of items) {
        const variantData = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });

        if (variantData) {
          const qtyToRevert =
            Number(item.qty) * Number(variantData.conversionToBase);

          await tx
            .update(products)
            .set({ stock: sql`${products.stock} + ${qtyToRevert.toFixed(3)}` })
            .where(eq(products.id, item.productId));

          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "sale_cancel",
            qtyBaseUnit: qtyToRevert.toFixed(4),
            unitFactorAtMutation: variantData.conversionToBase,
            reference: `VOID-${existingSale.invoiceNumber}`,
            userId: existingSale.userId,
          });
        }
      }

      if (
        existingSale.customerId &&
        Number(existingSale.totalBalanceUsed) > 0
      ) {
        await tx
          .update(customers)
          .set({
            creditBalance: sql`${customers.creditBalance} + ${Number(existingSale.totalBalanceUsed).toFixed(2)}`,
          })
          .where(eq(customers.id, existingSale.customerId));
      }

      const existingDebt = await tx.query.debts.findFirst({
        where: eq(debts.saleId, saleId),
      });

      if (existingDebt) {
        await tx
          .update(debts)
          .set({
            isActive: false,
            deletedAt: new Date(),
            status: "cancelled",
          })
          .where(eq(debts.id, existingDebt.id));
      }

      if (existingSale.customerReturns.length > 0) {
        for (const ret of existingSale.customerReturns) {
          if (!ret.isArchived) {
            await voidCustomerReturn(tx, ret.id);
          }
        }
      }

      const [archivedSale] = await tx
        .update(sales)
        .set({ isArchived: true, status: "cancelled" })
        .where(eq(sales.id, saleId))
        .returning();

      return archivedSale;
    });

    return NextResponse.json({
      success: true,
      message: "Penjualan berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
