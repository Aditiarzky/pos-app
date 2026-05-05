import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { customers, products, purchaseOrders, sales } from "@/drizzle/schema";
import {
  parseTrashPayload,
  TrashEntityType,
  TrashItemInput,
  TrashValidationError,
} from "../_lib/trash-utils";
import { verifySession } from "@/lib/auth";
import { recordProductAudit } from "@/app/api/products/_lib/audit";

type ForceDeleteResult = {
  id: number;
  type: TrashEntityType;
  name: string;
};

type TxType = Parameters<Parameters<typeof db.transaction>[0]>[0];

async function forceDeleteOne(
  tx: TxType,
  item: TrashItemInput,
  userId: number | null,
): Promise<ForceDeleteResult> {
  switch (item.type) {
    case "product": {
      // Fetch snapshot before delete
      const productData = await tx.query.products.findFirst({
        where: eq(products.id, item.id),
        with: { category: { columns: { id: true, name: true } } },
      });

      const [deleted] = await tx
        .delete(products)
        .where(
          and(
            eq(products.id, item.id),
            or(isNotNull(products.deletedAt), eq(products.isActive, false)),
          ),
        )
        .returning({ id: products.id, name: products.name });

      if (!deleted) {
        throw new Error(`Product dengan ID ${item.id} tidak ditemukan di Trash`);
      }

      // Audit log with snapshot (productId will be null after delete)
      await recordProductAudit(tx, {
        productId: null,
        userId,
        action: "hard_delete",
        changes: null,
        snapshot: {
          id: deleted.id,
          name: deleted.name,
          sku: productData?.sku,
          categoryId: productData?.categoryId,
        },
      });

      return { id: deleted.id, type: "product", name: deleted.name };
    }

    case "customer": {
      const [deleted] = await tx
        .delete(customers)
        .where(
          and(
            eq(customers.id, item.id),
            or(isNotNull(customers.deletedAt), eq(customers.isActive, false)),
          ),
        )
        .returning({ id: customers.id, name: customers.name });

      if (!deleted) {
        throw new Error(`Customer dengan ID ${item.id} tidak ditemukan di Trash`);
      }

      return { id: deleted.id, type: "customer", name: deleted.name };
    }

    case "sale": {
      const [deleted] = await tx
        .delete(sales)
        .where(
          and(
            eq(sales.id, item.id),
            or(eq(sales.isArchived, true), isNotNull(sales.deletedAt)),
          ),
        )
        .returning({ id: sales.id, name: sales.invoiceNumber });

      if (!deleted) {
        throw new Error(`Sale dengan ID ${item.id} tidak ditemukan di Trash`);
      }

      return { id: deleted.id, type: "sale", name: deleted.name };
    }

    case "purchase": {
      const [deleted] = await tx
        .delete(purchaseOrders)
        .where(
          and(
            eq(purchaseOrders.id, item.id),
            or(
              eq(purchaseOrders.isArchived, true),
              isNotNull(purchaseOrders.deletedAt),
            ),
          ),
        )
        .returning({ id: purchaseOrders.id, name: purchaseOrders.orderNumber });

      if (!deleted) {
        throw new Error(`Purchase dengan ID ${item.id} tidak ditemukan di Trash`);
      }

      return {
        id: deleted.id,
        type: "purchase",
        name: deleted.name || `PO-${deleted.id}`,
      };
    }

    default:
      throw new Error("Tipe data belum didukung");
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await verifySession();
    const userId = session?.userId ?? null;

    const payload = await request.json();
    const items = parseTrashPayload(payload);

    const result = await db.transaction(async (tx) => {
      const deleted: ForceDeleteResult[] = [];

      for (const item of items) {
        deleted.push(await forceDeleteOne(tx, item, userId));
      }

      return deleted;
    });

    return NextResponse.json({
      success: true,
      message:
        items.length > 1
          ? `${items.length} data berhasil dihapus permanen`
          : "Data berhasil dihapus permanen",
      data: result,
    });
  } catch (error) {
    if (error instanceof TrashValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    return handleApiError(error);
  }
}
