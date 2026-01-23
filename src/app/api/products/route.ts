import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productBarcodes } from "@/drizzle/schema";
import { and, eq, lte, sql, exists } from "drizzle-orm";
import { validateProductData } from "@/lib/validations/product";
import {
  formatMeta,
  getSearchAndOrderFTS,
  parsePagination,
} from "@/lib/query-helper";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const barcodeSearch = searchParams.get("barcode");

    const { searchFilter, searchOrder } = getSearchAndOrderFTS(
      params.search,
      params.order,
      params.orderBy,
      products,
    );

    let finalFilter = and(searchFilter, eq(products.isActive, true));

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
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = validateProductData(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format() || "Unknown error",
        },
        { status: 400 },
      );
    }

    const { barcodes, ...productData } = validation.data;

    const newBarcodeValue: any[] = [];
    const result = await db.transaction(async (tx) => {
      const [newProduct] = await tx
        .insert(products)
        .values(productData)
        .returning();
      if (barcodes && Array.isArray(barcodes) && barcodes.length > 0) {
        const barcodeValues = barcodes.map((b: string) => ({
          productId: newProduct.id,
          barcode: b,
        }));
        const insertedBarcodes = await tx
          .insert(productBarcodes)
          .values(barcodeValues)
          .returning({
            id: productBarcodes.id,
            barcode: productBarcodes.barcode,
          });
        newBarcodeValue.push(...insertedBarcodes);
      }

      return { product: newProduct, barcodes: newBarcodeValue };
    });

    return NextResponse.json(
      {
        success: true,
        data: result,
        message: "Product created successfully",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("Error inserting product:", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { success: false, error: "SKU atau Barcode sudah terdaftar" },
        { status: 400 },
      );
    }
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 },
    );
  }
}
