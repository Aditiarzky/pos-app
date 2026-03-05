import { storeSettings } from "@/drizzle/schema";
import { handleApiError } from "@/lib/api-utils";
import { db } from "@/lib/db";
import { validateStoreSettings } from "@/lib/validations/settings";
import { eq } from "drizzle-orm";
import { NextRequest, NextResponse } from "next/server";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(request: NextRequest) {
  try {
    const settings = await db.query.storeSettings.findFirst();
    if (!settings) {
      return NextResponse.json(
        { success: false, error: "Setting data not found" },
        { status: 404 }
      );
    }
    return NextResponse.json({ success: true, data: settings });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedSettings = await validateStoreSettings(body);

    if (!validatedSettings.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validatedSettings.error.format() || "Unknown error",
        },
        { status: 400 }
      );
    }

    const settingId = validatedSettings.data.id || 1;

    if (isNaN(settingId)) {
      return NextResponse.json(
        { success: false, error: "Invalid setting ID" },
        { status: 400 }
      );
    }

    const [updatedSettings] = await db.update(storeSettings).set(validatedSettings.data).where(eq(storeSettings.id, settingId)).returning();
    return NextResponse.json({ success: true, data: updatedSettings });
  } catch (error) {
    return handleApiError(error);
  }
}
