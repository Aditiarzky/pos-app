import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { verifySession } from "@/lib/auth";
import { markNotificationsAsRead } from "../../_lib/notification-state-db";

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(_: NextRequest, context: RouteContext) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Not authenticated" },
        { status: 401 },
      );
    }

    const { id } = await context.params;
    const notificationId = id?.trim();

    if (!notificationId) {
      return NextResponse.json(
        { success: false, error: "Notification id wajib diisi" },
        { status: 400 },
      );
    }

    const count = await markNotificationsAsRead(session.userId, [notificationId]);

    return NextResponse.json({
      success: true,
      message: `${count} notifikasi ditandai sebagai telah dibaca`,
      data: { count },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
