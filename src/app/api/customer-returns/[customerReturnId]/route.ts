import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils"; // Assumed utility
import { customerReturns } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";
import { voidCustomerReturn } from "../_lib/return-service";

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
        { success: false, error: "ID Retur tidak valid" },
        { status: 400 },
      );
    }

    const result = await db.transaction(async (tx) => {
      return await voidCustomerReturn(tx, returnId);
    });

    return NextResponse.json({
      success: true,
      message: "Data retur berhasil dibatalkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
