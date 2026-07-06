import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import {
  products,
  productBarcodes,
  productVariants,
  categories,
  stockMutations,
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
import { verifySession } from "@/lib/auth";
// import { recordProductAudit } from "./_lib/audit";

export async function GET(request: NextRequest) {
  try {
    const params = parsePagination(request);
    const { searchParams } = new URL(request.url);
    const categoryIdParam = searchParams.get("categoryId");
    const barcodeSearch = searchParams.get("barcode");
    const lowStockOnly = searchParams.get("lowStockOnly") === "true";
    const categoryId = categoryIdParam ? Number(categoryIdParam) : NaN;

    const { searchFilter, searchOrder } = getSearchAndOrderFTS(
      params.search,
      params.order,
      params.orderBy,
      products,
    );

    let finalFilter = and(searchFilter, eq(products.isActive, true));

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

    if (!Number.isNaN(categoryId)) {
      finalFilter = and(finalFilter, eq(products.categoryId, categoryId));
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

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [
      productsData,
      totalRes,
      totalStockCount,
      countUnderMinimumStock,
      countTodayMutations,
    ] = await Promise.all([
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
      db
        .select({ count: sql<number>`count(*)` })
        .from(stockMutations)
        .where(sql`${stockMutations.createdAt} >= ${startOfToday}`),
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
        todayStockActivity: Number(countTodayMutations[0]?.count || 0),
      },
      meta: formatMeta(totalCount, params.page, params.limit),
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!session.roles.includes("admin sistem")) {
      return NextResponse.json(
        { success: false, error: "Forbidden: Admin system role required" },
        { status: 403 },
      );
    }

    const body = await request.json();
    console.log(
      "POST /api/products RAW body variants:",
      JSON.stringify(body.variants, null, 2),
    );
    const validation = validateProductData(body);
    console.log("POST /api/products VALIDATION success:", validation.success);
    if (validation.success) {
      console.log(
        "POST /api/products VALIDATED variants:",
        JSON.stringify(validation.data.variants, null, 2),
      );
    }

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
      let newBarcodes: unknown = [];
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
            variants.map((v: ProductVariantInputType) => {
              const dbVal = { ...v };
              delete dbVal.referenceVariantIndex;
              return {
                ...dbVal,
                productId: newProduct.id,
                sku: `${parentSku}-${v.unitId}-${v.conversionToBase}`,
              };
            }),
          )
          .returning();

        // Update conversionReferenceVariantId based on referenceVariantIndex
        console.log(
          "POST /api/products resolving references. Variants count:",
          variants?.length,
          "Inserted count:",
          newVariants.length,
        );
        for (let i = 0; i < variants.length; i++) {
          const refIndex = variants[i].referenceVariantIndex;
          console.log(
            `Variant index ${i} (unitId: ${variants[i].unitId}) -> referenceVariantIndex is: ${refIndex}`,
          );
          if (
            refIndex !== undefined &&
            refIndex !== null &&
            refIndex >= 0 &&
            refIndex < newVariants.length
          ) {
            const refVariantId = newVariants[refIndex].id;
            console.log(
              `Setting variant id ${newVariants[i].id} conversionReferenceVariantId = ${refVariantId}`,
            );
            await tx
              .update(productVariants)
              .set({ conversionReferenceVariantId: refVariantId })
              .where(eq(productVariants.id, newVariants[i].id!));

            newVariants[i].conversionReferenceVariantId = refVariantId;
          } else {
            console.log(
              `Setting variant id ${newVariants[i].id} conversionReferenceVariantId = null`,
            );
          }
        }
      }

      // 4. Audit log
      /* await recordProductAudit(tx, {
        productId: newProduct.id,
        userId: session.userId,
        action: "create",
        changes: null,
      }); */

      return { ...newProduct, barcodes: newBarcodes, variants: newVariants };
    });

    return NextResponse.json({ success: true, data: result }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
