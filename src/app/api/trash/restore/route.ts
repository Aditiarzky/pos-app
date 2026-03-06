import { NextRequest, NextResponse } from "next/server";
import { and, eq, isNotNull, or, sql } from "drizzle-orm";
import {
  customers,
  debts,
  products,
  productVariants,
  purchaseOrders,
  sales,
  stockMutations,
} from "@/drizzle/schema";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import {
  parseTrashPayload,
  RestoreIntegrityError,
  TrashEntityType,
  TrashItemInput,
  TrashValidationError,
} from "../_lib/trash-utils";

type RestoreResult = {
  id: number;
  type: TrashEntityType;
  name: string;
};

async function restoreProduct(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: number,
): Promise<RestoreResult> {
  const [updated] = await tx
    .update(products)
    .set({
      isActive: true,
      deletedAt: null,
    })
    .where(eq(products.id, id))
    .returning({ id: products.id, name: products.name });

  if (!updated) {
    throw new Error("Product tidak ditemukan");
  }

  return { id: updated.id, type: "product", name: updated.name };
}

async function restoreCustomer(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: number,
): Promise<RestoreResult> {
  const [updated] = await tx
    .update(customers)
    .set({
      isActive: true,
      deletedAt: null,
    })
    .where(eq(customers.id, id))
    .returning({ id: customers.id, name: customers.name });

  if (!updated) {
    throw new Error("Customer tidak ditemukan");
  }

  return { id: updated.id, type: "customer", name: updated.name };
}

async function restoreSale(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: number,
): Promise<RestoreResult> {
  const existingSale = await tx.query.sales.findFirst({
    where: and(
      eq(sales.id, id),
      or(eq(sales.isArchived, true), isNotNull(sales.deletedAt)),
    ),
    with: {
      items: true,
      debt: true,
    },
  });

  if (!existingSale) {
    throw new Error("Data penjualan tidak ditemukan di Trash");
  }

  const itemChecks: Array<{
    item: (typeof existingSale.items)[number];
    qtyInBase: number;
    conversion: string;
  }> = [];

  for (const item of existingSale.items) {
    const [variantData, productData] = await Promise.all([
      tx.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
      }),
      tx.query.products.findFirst({ where: eq(products.id, item.productId) }),
    ]);

    if (!variantData || !productData) {
      throw new RestoreIntegrityError(
        "Cannot restore sale",
        "Referenced product/variant does not exist anymore",
      );
    }

    const qtyInBase = Number(item.qty) * Number(variantData.conversionToBase);

    if (Number(productData.stock) < qtyInBase) {
      throw new RestoreIntegrityError(
        "Cannot restore sale",
        "Product stock is insufficient to apply this sale again",
      );
    }

    itemChecks.push({
      item,
      qtyInBase,
      conversion: variantData.conversionToBase,
    });
  }

  if (existingSale.customerId && Number(existingSale.totalBalanceUsed) > 0) {
    const customerData = await tx.query.customers.findFirst({
      where: eq(customers.id, existingSale.customerId),
    });

    if (!customerData) {
      throw new RestoreIntegrityError(
        "Cannot restore sale",
        "Customer no longer exists",
      );
    }

    if (
      Number(customerData.creditBalance) < Number(existingSale.totalBalanceUsed)
    ) {
      throw new RestoreIntegrityError(
        "Cannot restore sale",
        "Customer balance is insufficient to rollback this sale",
      );
    }
  }

  for (const checked of itemChecks) {
    await tx
      .update(products)
      .set({ stock: sql`${products.stock} - ${checked.qtyInBase.toFixed(3)}` })
      .where(eq(products.id, checked.item.productId));

    await tx.insert(stockMutations).values({
      productId: checked.item.productId,
      variantId: checked.item.variantId,
      type: "sale",
      qtyBaseUnit: (-checked.qtyInBase).toFixed(4),
      unitFactorAtMutation: checked.conversion,
      reference: `RESTORE-${existingSale.invoiceNumber}`,
      userId: existingSale.userId,
    });
  }

  if (existingSale.customerId && Number(existingSale.totalBalanceUsed) > 0) {
    await tx
      .update(customers)
      .set({
        creditBalance: sql`${customers.creditBalance} - ${Number(existingSale.totalBalanceUsed).toFixed(2)}`,
      })
      .where(eq(customers.id, existingSale.customerId));
  }

  if (existingSale.debt && Number(existingSale.debt.remainingAmount) > 0) {
    await tx
      .update(debts)
      .set({
        isActive: true,
        deletedAt: null,
        status: "unpaid",
      })
      .where(eq(debts.id, existingSale.debt.id));
  }

  const restoredStatus =
    existingSale.debt && Number(existingSale.debt.remainingAmount) > 0
      ? "debt"
      : "completed";

  const [restoredSale] = await tx
    .update(sales)
    .set({
      isArchived: false,
      deletedAt: null,
      status: restoredStatus,
    })
    .where(eq(sales.id, id))
    .returning({ id: sales.id, name: sales.invoiceNumber });

  return {
    id: restoredSale.id,
    type: "sale",
    name: restoredSale.name,
  };
}

async function restorePurchase(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  id: number,
): Promise<RestoreResult> {
  const existingOrder = await tx.query.purchaseOrders.findFirst({
    where: and(
      eq(purchaseOrders.id, id),
      or(eq(purchaseOrders.isArchived, true), isNotNull(purchaseOrders.deletedAt)),
    ),
    with: {
      items: true,
    },
  });

  if (!existingOrder) {
    throw new Error("Data pembelian tidak ditemukan di Trash");
  }

  for (const item of existingOrder.items) {
    const [productData, variantData] = await Promise.all([
      tx.query.products.findFirst({ where: eq(products.id, item.productId) }),
      tx.query.productVariants.findFirst({
        where: eq(productVariants.id, item.variantId),
      }),
    ]);

    if (!productData || !variantData) {
      throw new RestoreIntegrityError(
        "Cannot restore purchase",
        "Referenced product/variant does not exist anymore",
      );
    }

    const conversion = Number(variantData.conversionToBase);
    const qtyInBaseUnit = Number(item.qty) * conversion;
    const pricePerBaseUnit = Number(item.price) / conversion;

    const currentStock = Number(productData.stock) || 0;
    const currentAvgCost = Number(productData.averageCost) || 0;

    const newStock = currentStock + qtyInBaseUnit;
    const newAvgCost =
      currentStock > 0
        ? (currentStock * currentAvgCost + qtyInBaseUnit * pricePerBaseUnit) /
        newStock
        : pricePerBaseUnit;

    await tx
      .update(products)
      .set({
        stock: newStock.toFixed(3),
        averageCost: newAvgCost.toFixed(4),
        lastPurchaseCost: pricePerBaseUnit.toFixed(4),
      })
      .where(eq(products.id, item.productId));

    await tx.insert(stockMutations).values({
      productId: item.productId,
      variantId: item.variantId,
      type: "purchase",
      qtyBaseUnit: qtyInBaseUnit.toFixed(4),
      unitFactorAtMutation: variantData.conversionToBase,
      reference:
        existingOrder.orderNumber ||
        `PO-${existingOrder.id.toString().padStart(6, "0")}`,
      userId: existingOrder.userId,
    });
  }

  const [restoredOrder] = await tx
    .update(purchaseOrders)
    .set({
      isArchived: false,
      deletedAt: null,
    })
    .where(eq(purchaseOrders.id, id))
    .returning({ id: purchaseOrders.id, name: purchaseOrders.orderNumber });

  return {
    id: restoredOrder.id,
    type: "purchase",
    name: restoredOrder.name || `PO-${restoredOrder.id}`,
  };
}

async function restoreByType(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  item: TrashItemInput,
) {
  switch (item.type) {
    case "product":
      return restoreProduct(tx, item.id);
    case "customer":
      return restoreCustomer(tx, item.id);
    case "sale":
      return restoreSale(tx, item.id);
    case "purchase":
      return restorePurchase(tx, item.id);
    default:
      throw new Error("Tipe data belum didukung");
  }
}

export async function POST(request: NextRequest) {
  try {
    const payload = await request.json();
    const items = parseTrashPayload(payload);

    const result = await db.transaction(async (tx) => {
      const restoredItems: RestoreResult[] = [];

      for (const item of items) {
        const restored = await restoreByType(tx, item);
        restoredItems.push(restored);
      }

      return restoredItems;
    });

    return NextResponse.json({
      success: true,
      message:
        items.length > 1
          ? `${items.length} data berhasil dipulihkan`
          : "Data berhasil dipulihkan",
      data: result,
    });
  } catch (error) {
    if (error instanceof TrashValidationError) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 },
      );
    }

    if (error instanceof RestoreIntegrityError) {
      return NextResponse.json(
        {
          success: false,
          message: error.message,
          reason: error.reason,
        },
        { status: 400 },
      );
    }

    return handleApiError(error);
  }
}
