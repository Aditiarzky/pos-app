import { operationalCosts } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { validateUpdateOperationalCost } from "@/lib/validations/operational-cost";
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

    const data = await db.query.operationalCosts.findFirst({
      where: eq(operationalCosts.id, id),
      with: {
        creator: { columns: { id: true, name: true } },
      },
    });

    if (!data) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── PATCH /api/operational-costs/[id] ────────────────────────────────────────

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
    const validated = validateUpdateOperationalCost(body);

    if (!validated.success) {
      return NextResponse.json(
        { success: false, error: validated.error.issues[0].message },
        { status: 400 },
      );
    }

    const existing = await db.query.operationalCosts.findFirst({
      where: eq(operationalCosts.id, id),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan" }, { status: 404 });
    }

    const { amount, effectiveTo, notes, ...rest } = validated.data;

    const [updated] = await db
      .update(operationalCosts)
      .set({
        ...rest,
        ...(amount !== undefined && { amount: amount.toFixed(2) }),
        ...(effectiveTo !== undefined && { effectiveTo: effectiveTo ?? null }),
        ...(notes !== undefined && { notes: notes ?? null }),
        updatedAt: new Date(),
      })
      .where(eq(operationalCosts.id, id))
      .returning();

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return handleApiError(error);
  }
}

// ── DELETE /api/operational-costs/[id] ───────────────────────────────────────

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

    const existing = await db.query.operationalCosts.findFirst({
      where: eq(operationalCosts.id, id),
    });

    if (!existing) {
      return NextResponse.json({ success: false, error: "Data tidak ditemukan" }, { status: 404 });
    }

    await db.delete(operationalCosts).where(eq(operationalCosts.id, id));

    return NextResponse.json({ success: true, message: "Biaya operasional berhasil dihapus" });
  } catch (error) {
    return handleApiError(error);
  }
}
