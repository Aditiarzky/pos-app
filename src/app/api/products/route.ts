import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productBarcodes,
  productVariants,
  categories,
} from "@/drizzle/schema";
import { and, eq, lte, sql, exists } from "drizzle-orm";
import {
  ProductVariantInputType,
  validateProductData,
} from "@/lib/validations/product";
import {
  formatMeta,
  getSearchAndOrderFTS,
  parsePagination,
} from "@/lib/query-helper";
import { handleApiError } from "@/lib/api-utils";
import { getInitial } from "@/lib/utils";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const barcodeSearch = searchParams.get("barcode");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";

    const { searchFilter, searchOrder } = getSearchAndOrderFTS(
      params.search,
      params.order,
      params.orderBy,
      products,
    );

    let finalFilter = and(searchFilter, eq(products.isActive, true));

    // If search is provided, also try to match barcodes
    if (params.search) {
      finalFilter = and(
        eq(products.isActive, true),
        sql`(${searchFilter} OR EXISTS (
                SELECT 1 FROM product_barcodes 
                WHERE product_barcodes.product_id = ${products.id} 
                AND product_barcodes.barcode ILIKE ${`%${params.search}%`}
            ))`,
      );
    }

    if (lowStockOnly) {
      finalFilter = and(finalFilter, lte(products.stock, products.minStock));
    }

    if (barcodeSearch) {
      finalFilter = and(
        finalFilter,
        exists(
          db
            .select()
            .from(productBarcodes)
            .where(
              and(
                eq(productBarcodes.productId, products.id),
                eq(productBarcodes.barcode, barcodeSearch),
              ),
            ),
        ),
      );
    }

    const [productsData, totalRes, totalStockCount, countUnderMinimumStock] =
      await Promise.all([
        db.query.products.findMany({
          where: finalFilter,
          with: {
            unit: { columns: { id: true, name: true } },
            category: { columns: { id: true, name: true } },
            barcodes: {
              columns: { id: true, barcode: true },
            },
            variants: {
              where: eq(productVariants.isActive, true),
              columns: {
                id: true,
                name: true,
                sku: true,
                conversionToBase: true,
                sellPrice: true,
              },
              with: { unit: { columns: { id: true, name: true } } },
            },
          },
          orderBy: searchOrder,
          limit: params.limit,
          offset: params.offset,
        }),

        db
          .select({ count: sql<number>`count(*)` })
          .from(products)
          .where(finalFilter),
        db
          .select({ countStock: sql<number>`sum(stock)` })
          .from(products)
          .where(finalFilter),
        db
          .select({ countUnderMinimumStock: sql<number>`count(*)` })
          .from(products)
          .where(and(finalFilter, lte(products.stock, products.minStock))),
      ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: productsData,
      analytics: {
        totalProducts: totalCount,
        totalStock: Number(totalStockCount[0]?.countStock || 0),
        underMinimumStock: Number(
          countUnderMinimumStock[0]?.countUnderMinimumStock || 0,
        ),
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
    const validation = validateProductData(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, details: validation.error.format() },
        { status: 400 },
      );
    }

    const { barcodes, variants, ...productData } = validation.data;

    const result = await db.transaction(async (tx) => {
      const category = await tx.query.categories.findFirst({
        where: eq(categories.id, Number(productData.categoryId)),
      });
      const catCode = getInitial(category?.name || "NON");
      const prodCode = getInitial(productData.name);

      // 1. Insert Product
      const [newProduct] = await tx
        .insert(products)
        .values({ ...productData, sku: "TEMP-SKU" })
        .returning();

      const parentSku = `${catCode}-${prodCode}-${newProduct.id}`;
      await tx
        .update(products)
        .set({ sku: parentSku })
        .where(eq(products.id, newProduct.id));

      // 2. Insert Barcodes
      let newBarcodes: any[] = [];
      if (barcodes?.length) {
        newBarcodes = await tx
          .insert(productBarcodes)
          .values(
            barcodes.map((b) => ({
              productId: newProduct.id,
              barcode: b.barcode,
            })),
          )
          .returning({
            id: productBarcodes.id,
            barcode: productBarcodes.barcode,
          });
      }

      // 3. Insert Variants
      let newVariants: ProductVariantInputType[] = [];
      if (variants?.length) {
        newVariants = await tx
          .insert(productVariants)
          .values(
            variants.map((v: ProductVariantInputType) => ({
              ...v,
              productId: newProduct.id,
              sku: `${parentSku}-${v.unitId}`,
            })),
          )
          .returning();
      }

      return { ...newProduct, barcodes: newBarcodes, variants: newVariants };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error: any) {
    return handleApiError(error);
  }
}
