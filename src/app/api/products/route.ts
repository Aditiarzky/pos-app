import { db } from "@/lib/db";
import { products, productVariants, productUnits } from "@/drizzle/schema";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { categoryId, sku, name, baseUnitId, minStock, variants, units } =
      body;

    const [product] = await db
      .insert(products)
      .values({
        categoryId,
        sku,
        name,
        baseUnitId,
        minStock,
      })
      .returning();

    // insert units + conversion
    if (units?.length) {
      await db.insert(productUnits).values(
        units.map((u: any) => ({
          productId: product.id,
          unitId: u.unitId,
          conversionToBase: u.conversionToBase,
          isPurchaseUnit: u.isPurchaseUnit ?? false,
          isSalesUnit: u.isSalesUnit ?? false,
        }))
      );
    }

    // insert variants
    if (variants?.length) {
      await db.insert(productVariants).values(
        variants.map((v: any) => ({
          productId: product.id,
          name: v.name,
          sku: v.sku,
          unitId: v.unitId,
          sellPrice: v.sellPrice,
        }))
      );
    }

    return NextResponse.json({ success: true, product });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 400 });
  }
}
