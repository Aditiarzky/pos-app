import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { products } from "@/drizzle/schema";
import { desc, sql } from "drizzle-orm";
import { validateProductData } from "@/lib/validations/product";

// GET semua products dengan pagination dan search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10"));
    const search = searchParams.get("search")?.trim() || "";
    const offset = (page - 1) * limit;

    let searchFilter;
    let searchOrder;

    if (search) {
      // pecah search string menjadi kata-kata, tambahkan ':*' di tiap kata
      const formattedSearch = search
        .split(/\s+/)
        .map((word) => `${word}:*`)
        .join(" & ");

      const searchQuery = sql`to_tsquery('indonesian', ${formattedSearch})`;

      searchFilter = sql`${products.searchVector} @@ ${searchQuery}`;

      // urutkan berdasarkan yang paling cocok
      searchOrder = (fields: any, { desc }: any) => [
        desc(sql`ts_rank(${fields.searchVector}, ${searchQuery})`),
      ];
    } else {
      searchFilter = undefined;
      searchOrder = (fields: any, { desc }: any) => [desc(fields.createdAt)];
    }

    const [productsData, totalRes] = await Promise.all([
      db.query.products.findMany({
        where: searchFilter,
        with: {
          unit: true,
          category: true,
          variants: true,
        },
        orderBy: searchOrder,
        limit: limit,
        offset: offset,
      }),

      db
        .select({ count: sql<number>`count(*)` })
        .from(products)
        .where(searchFilter),
    ]);

    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: productsData,
      meta: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

// POST tambah product
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
        { status: 400 }
      );
    }

    const [newProduct] = await db
      .insert(products)
      .values(validation.data)
      .returning();

    return NextResponse.json(
      {
        success: true,
        data: newProduct,
        message: "Product created successfully",
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error inserting product:", error);
    return NextResponse.json(
      { success: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
