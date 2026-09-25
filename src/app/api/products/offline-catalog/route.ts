import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products, productVariants } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { handleApiError } from "@/lib/api-utils";

export type OfflineProduct = {
  productId: number;
  variantId: number;
  barcode: string | null;
  name: string;
  variantName: string;
  sellPrice: number;
  stock: number;
  unit: string;
  updatedAt: string;
};

export async function GET() {
  try {
    const productsData = await db.query.products.findMany({
      where: eq(products.isActive, true),
      with: {
        variants: {
          where: eq(productVariants.isActive, true),
          with: {
            unit: { columns: { name: true } },
          },
          columns: {
            id: true,
            name: true,
            sellPrice: true,
            conversionToBase: true,
          },
        },
        barcodes: {
          columns: { barcode: true },
        },
        unit: {
          columns: { name: true },
        },
      },
      columns: {
        id: true,
        name: true,
        stock: true,
        updatedAt: true,
      },
    });

    const offlineCatalog: OfflineProduct[] = productsData.flatMap((product) => {
      // Get all unique barcodes for this product
      const productBarcodesList = product.barcodes?.map((b) => b.barcode) || [];

      return product.variants.map((variant) => {
        const variantStock =
          Number(product.stock) / Number(variant.conversionToBase || 1);
        const roundedStock = Math.floor(variantStock); // Bulatkan ke bawah

        return {
          productId: product.id,
          variantId: variant.id,
          // Ambil barcode pertama, atau null jika tidak ada
          barcode: productBarcodesList.length > 0 ? productBarcodesList[0] : null,
          name: product.name,
          variantName: variant.name,
          sellPrice: Number(variant.sellPrice),
          stock: roundedStock,
          unit: variant.unit?.name || product.unit?.name || "unit",
          updatedAt: product.updatedAt?.toISOString() || new Date().toISOString(),
        };
      });
    });

    return NextResponse.json({ success: true, data: offlineCatalog });
  } catch (error) {
    return handleApiError(error);
  }
}
