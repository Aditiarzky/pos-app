import { NextRequest, NextResponse } from "next/server";
import { eq, ne } from "drizzle-orm";
import { db } from "@/lib/db";
import { handleApiError } from "@/lib/api-utils";
import { trashSettings } from "@/drizzle/schema";
import { getTrashSettings } from "../_lib/cleanup-logic";

export async function GET() {
  try {
    const settings = await getTrashSettings();
    return NextResponse.json({
      success: true,
      data: settings,
    });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { cleanupIntervalMinutes } = body;

    if (
      cleanupIntervalMinutes === undefined ||
      typeof cleanupIntervalMinutes !== "number" ||
      cleanupIntervalMinutes < 1
    ) {
      return NextResponse.json(
        { success: false, error: "Interval harus berupa angka minimal 1 menit" },
        { status: 400 },
      );
    }

    // Ambil record utama
    const mainSettings = await getTrashSettings();

    const result = await db.transaction(async (tx) => {
      // 1. Update record utama
      const [updated] = await tx
        .update(trashSettings)
        .set({ cleanupIntervalMinutes, updatedAt: new Date() })
        .where(eq(trashSettings.id, mainSettings.id))
        .returning();

      // 2. Bersihkan record duplikat jika ada (agar tidak membingungkan)
      await tx
        .delete(trashSettings)
        .where(ne(trashSettings.id, mainSettings.id));

      return updated;
    });

    return NextResponse.json({
      success: true,
      message: "Pengaturan berhasil diperbarui dan duplikasi dibersihkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
