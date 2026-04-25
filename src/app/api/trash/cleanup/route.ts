import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { runTrashCleanup } from "../_lib/cleanup-logic";

export async function POST() {
  try {
    const result = await runTrashCleanup();

    return NextResponse.json({
      success: true,
      message:
        result.deletedCount > 0
          ? `${result.deletedCount} data lama berhasil dibersihkan`
          : "Tidak ada data lama yang perlu dibersihkan",
      data: result,
    });
  } catch (error) {
    return handleApiError(error);
  }
}
