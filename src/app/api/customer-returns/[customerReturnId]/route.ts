import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils"; // Assumed utility
import {
  customerReturns,
  customerReturnItems,
  products,
  productVariants,
  stockMutations,
  customers,
  customerExchangeItems,
} from "@/drizzle/schema";
import { eq, sql, and } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ customerReturnId: string }> },
) {
  try {
    const { customerReturnId } = await params;
    const returnId = Number(customerReturnId);

    if (isNaN(returnId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 },
      );
    }

    const returnData = await db.query.customerReturns.findFirst({
      where: eq(customerReturns.id, returnId),
      with: {
        customer: true,
        sales: true,
        items: {
          with: {
            product: true,
            productVariant: true,
          },
        },
        exchangeItems: {
          with: {
            product: true,
            productVariant: true,
          },
        },
      },
    });

    if (!returnData) {
      return NextResponse.json(
        { success: false, error: "Return not found" },
        { status: 404 },
      );
    }

    return NextResponse.json({ success: true, data: returnData });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ customerReturnId: string }> },
) {
  try {
    const { customerReturnId } = await params;
    const returnId = Number(customerReturnId);

    if (isNaN(returnId)) {
      return NextResponse.json(
        { success: false, error: "Invalid ID" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      const existingReturn = await tx.query.customerReturns.findFirst({
        where: eq(customerReturns.id, returnId),
        with: {
          items: true,
          exchangeItems: true,
        },
      });

      if (!existingReturn) throw new Error("Return transaction not found");
      if (existingReturn.isArchived)
        throw new Error("Return transaction already voided/archived");

      // 1. Revert Stock Changes from Return Items (Barang Masuk -> Keluar lagi)
      for (const item of existingReturn.items) {
        if (item.returnedToStock) {
          const variant = await tx.query.productVariants.findFirst({
            where: eq(productVariants.id, item.variantId),
          });
          if (variant) {
            const qtyBase = Number(item.qty) * Number(variant.conversionToBase);

            // Kurangi stok karena return dibatalkan (barang dianggap tidak jadi kembali ke toko)
            await tx
              .update(products)
              .set({
                stock: sql`${products.stock} - ${qtyBase.toFixed(3)}`,
              })
              .where(eq(products.id, item.productId));

            // Catat mutasi penyesuaian
            await tx.insert(stockMutations).values({
              productId: item.productId,
              variantId: item.variantId,
              type: "adjustment", // Menggunakan adjustment untuk koreksi
              qtyBaseUnit: (-qtyBase).toFixed(4), // Negatif = Keluar
              unitFactorAtMutation: variant.conversionToBase,
              reference: `VOID-${existingReturn.returnNumber}`,
              userId: existingReturn.userId, // Fallback to original user
            });
          }
        }
      }

      // 2. Revert Stock Changes from Exchange Items (Barang Keluar -> Masuk lagi)
      for (const item of existingReturn.exchangeItems) {
        const variant = await tx.query.productVariants.findFirst({
          where: eq(productVariants.id, item.variantId),
        });
        if (variant) {
          const qtyBase = Number(item.qty) * Number(variant.conversionToBase);

          // Tambah stok karena exchange dibatalkan (barang kembali ke toko)
          await tx
            .update(products)
            .set({
              stock: sql`${products.stock} + ${qtyBase.toFixed(3)}`,
            })
            .where(eq(products.id, item.productId));

          await tx.insert(stockMutations).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "adjustment",
            qtyBaseUnit: qtyBase.toFixed(4), // Positif = Masuk
            unitFactorAtMutation: variant.conversionToBase,
            reference: `VOID-${existingReturn.returnNumber}`,
            userId: existingReturn.userId,
          });
        }
      }

      // 3. Revert Financial Changes
      // Calculate original net refund logic
      // Positif (+) : Toko hutang ke Customer (Harus Refund/Deposit) -> Saat VOID, toko tarik saldo/uang kembali
      // Negatif (-) : Customer hutang ke Toko (Harus Bayar Kurangnya) -> Saat VOID, toko kembalikan uang customer

      // Implementasi simplifikasi: Revert based on compensation type

      if (existingReturn.compensationType === "credit_note") {
        if (existingReturn.customerId) {
          const refundAmount = Number(existingReturn.totalRefund);
          // Jika refundAmount positif, dulu saldo customer bertambah. Sekarang kurangi.
          // Jika refundAmount negatif, dulu saldo customer berkurang. Sekarang tambah.
          // Jadi operasinya selalu: creditBalance - refundAmount

          await tx
            .update(customers)
            .set({
              creditBalance: sql`${customers.creditBalance} - ${refundAmount.toFixed(2)}`,
            })
            .where(eq(customers.id, existingReturn.customerId));
        }
      }

      // Untuk "refund" (cash) dan "exchange" (mix), tidak ada saldo yg perlu diupdate otomatis
      // kecuali jika logic exchange dulu memotong saldo (tapi di logic POST, exchange hanya potong saldo via credit balance logic terpisah jika ada,
      // tapi di code POST existing, exchange logic paymentnya cash basis atau tagihan manual, tidak otomatis potong kredit saldo kecuali logicnya kompleks.
      // Di code POST step 20, exchange logic -> message "Kembalikan sisa uang" atau "Tagih kekurangan". Tidak sentuh saldo customer kecuali credit_note.

      // 4. Archive the Return
      const [archivedReturn] = await tx
        .update(customerReturns)
        .set({ isArchived: true })
        .where(eq(customerReturns.id, returnId))
        .returning();

      return archivedReturn;
    });

    return NextResponse.json({
      success: true,
      message: "Customer return successfully voided",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
