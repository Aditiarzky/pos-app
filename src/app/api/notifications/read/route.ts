import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { markNotificationsAsRead } from "../_lib/notification-state-db";

type MarkReadPayload = {
  id?: string;
  ids?: string[];
};

export async function POST(request: NextRequest) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const payload = (await request.json()) as MarkReadPayload;
    const ids = [payload.id, ...(payload.ids || [])]
      .filter((id): id is string => Boolean(id && id.trim()))
      .map((id) => id.trim());

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: "Notification id wajib diisi" },
        { status: 400 },
      );
    }

    const count = await markNotificationsAsRead(session.userId, ids);

    return NextResponse.json({
      success: true,
      message: `${count} notifikasi ditandai sebagai telah dibaca`,
      data: { count },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
