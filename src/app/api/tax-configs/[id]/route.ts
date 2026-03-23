import { taxConfigs } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { validateUpdateTaxConfig } from "@/lib/validations/tax-config";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const data = await db.query.taxConfigs.findFirst({
      where: eq(taxConfigs.id, id),
      with: {
        creator: { columns: { id: true, name: true } },
      },
    });

    if (!data) {
      return NextResponse.json({ success: false, error: "Konfigurasi pajak tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── PATCH /api/tax-configs/[id] ───────────────────────────────────────────────

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const body = await request.json();
    const parsed = validateUpdateTaxConfig(body);

    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0].message },
        { status: 400 },
      );
    }

    const existing = await db.query.taxConfigs.findFirst({
      where: eq(taxConfigs.id, id),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Konfigurasi pajak tidak ditemukan" }, { status: 404 });
    }

    const { rate, fixedAmount, appliesTo, effectiveTo, notes, ...rest } = parsed.data;

    const [updated] = await db
      .update(taxConfigs)
      .set({
        ...rest,
        ...(rate !== undefined && { rate: rate != null ? rate.toFixed(4) : null }),
        ...(fixedAmount !== undefined && { fixedAmount: fixedAmount != null ? fixedAmount.toFixed(2) : null }),
        ...(appliesTo !== undefined && { appliesTo: appliesTo ?? null }),
        ...(effectiveTo !== undefined && { effectiveTo: effectiveTo ?? null }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedAt: new Date(),
      })
      .where(eq(taxConfigs.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── DELETE /api/tax-configs/[id] ──────────────────────────────────────────────

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id: idParam } = await params;
    const id = Number(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ success: false, error: "ID tidak valid" }, { status: 400 });
    }

    const existing = await db.query.taxConfigs.findFirst({
      where: eq(taxConfigs.id, id),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Konfigurasi pajak tidak ditemukan" }, { status: 404 });
    }

    await db.delete(taxConfigs).where(eq(taxConfigs.id, id));

    return NextResponse.json({ success: true, message: "Konfigurasi pajak berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
