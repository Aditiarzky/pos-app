import { NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { clearReadNotifications } from "../../_lib/notification-state-db";

type ClearPayload = {
  ids?: string[];
};

export async function POST(request: Request) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    let payload: ClearPayload = {};

    try {
      payload = (await request.json()) as ClearPayload;
    } catch {
      payload = {};
    }

    const ids = (payload.ids || []).filter(
      (id): id is string => Boolean(id && id.trim()),
    );

    const count = await clearReadNotifications(
      session.userId,
      ids.length ? ids : undefined,
    );

    return NextResponse.json({
      success: true,
      message:
        count > 0
          ? `${count} notifikasi berhasil dibersihkan`
          : "Tidak ada notifikasi yang perlu dibersihkan",
      data: { count },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
