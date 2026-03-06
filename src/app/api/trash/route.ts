import { NextRequest, NextResponse } from "next/server";
import { and, eq, ilike, isNotNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { formatMeta, parsePagination } from "@/lib/query-helper";
import { customers, products, purchaseOrders, sales } from "@/drizzle/schema";
import { TrashEntityType } from "./_lib/trash-utils";

type TrashRow = {
  id: number;
  type: TrashEntityType;
  name: string;
  deleted_at: Date | null;
};

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const typeFilter = request.nextUrl.searchParams.get("type") as
      | TrashEntityType
      | null;

    const productWhere = and(
      or(isNotNull(products.deletedAt), eq(products.isActive, false)),
      params.search ? ilike(products.name, `%${params.search}%`) : undefined,
    );

    const salesWhere = and(
      or(eq(sales.isArchived, true), isNotNull(sales.deletedAt)),
      params.search
        ? ilike(sales.invoiceNumber, `%${params.search}%`)
        : undefined,
    );

    const purchaseWhere = and(
      or(eq(purchaseOrders.isArchived, true), isNotNull(purchaseOrders.deletedAt)),
      params.search
        ? ilike(purchaseOrders.orderNumber, `%${params.search}%`)
        : undefined,
    );

    const customerWhere = and(
      or(isNotNull(customers.deletedAt), eq(customers.isActive, false)),
      params.search ? ilike(customers.name, `%${params.search}%`) : undefined,
    );

    const [productRows, saleRows, purchaseRows, customerRows] =
      await Promise.all([
        db
          .select({
            id: products.id,
            name: products.name,
            deletedAt: products.deletedAt,
            updatedAt: products.updatedAt,
          })
          .from(products)
          .where(productWhere),
        db
          .select({
            id: sales.id,
            name: sales.invoiceNumber,
            deletedAt: sales.deletedAt,
            updatedAt: sales.updatedAt,
          })
          .from(sales)
          .where(salesWhere),
        db
          .select({
            id: purchaseOrders.id,
            name: purchaseOrders.orderNumber,
            deletedAt: purchaseOrders.deletedAt,
            updatedAt: purchaseOrders.updatedAt,
          })
          .from(purchaseOrders)
          .where(purchaseWhere),
        db
          .select({
            id: customers.id,
            name: customers.name,
            deletedAt: customers.deletedAt,
            updatedAt: customers.updatedAt,
          })
          .from(customers)
          .where(customerWhere),
      ]);

    const allRows: TrashRow[] = [
      ...productRows.map((row) => ({
        id: row.id,
        type: "product" as const,
        name: row.name,
        deleted_at: row.deletedAt ?? row.updatedAt ?? null,
      })),
      ...saleRows.map((row) => ({
        id: row.id,
        type: "sale" as const,
        name: row.name,
        deleted_at: row.deletedAt ?? row.updatedAt ?? null,
      })),
      ...purchaseRows.map((row) => ({
        id: row.id,
        type: "purchase" as const,
        name: (row.name ?? 'Unknown Purchase Order') as string, // Explicitly cast to string to satisfy TrashRow type
        deleted_at: row.deletedAt ?? row.updatedAt ?? null,
      })),
      ...customerRows.map((row) => ({
        id: row.id,
        type: "customer" as const,
        name: row.name,
        deleted_at: row.deletedAt ?? row.updatedAt ?? null,
      })),
    ];

    const filteredRows = typeFilter
      ? allRows.filter((row) => row.type === typeFilter)
      : allRows;

    const sortedRows = filteredRows.sort((a, b) => {
      const aTime = a.deleted_at ? new Date(a.deleted_at).getTime() : 0;
      const bTime = b.deleted_at ? new Date(b.deleted_at).getTime() : 0;
      return bTime - aTime;
    });

    const totalCount = sortedRows.length;
    const paginatedRows = sortedRows.slice(params.offset, params.offset + params.limit);

    return NextResponse.json({
      success: true,
      data: paginatedRows,
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}
