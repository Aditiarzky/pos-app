import { NextRequest, NextResponse } from "next/server";
import { handleApiError } from "@/lib/api-utils";
import { clearReadNotifications } from "../_lib/notification-store";

type ClearPayload = {
  ids?: string[];
};

export async function DELETE(request: NextRequest) {
  try {
    let payload: ClearPayload = {};

    try {
      payload = (await request.json()) as ClearPayload;
    } catch {
      payload = {};
    }

    const ids = (payload.ids || []).filter(
      (id): id is string => Boolean(id && id.trim()),
    );

    const count = clearReadNotifications(ids.length ? ids : undefined);

    return NextResponse.json({
      success: true,
      message: `${count} notifikasi read dibersihkan`,
      data: { count },
    });
  } catch (error) {
    return handleApiError(error);
  }
}
