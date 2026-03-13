import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetRequests } from "@/drizzle/schema";
import { desc, eq } from "drizzle-orm";
import { z } from "zod";

const statusQuerySchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function GET(req: NextRequest) {
  try {
    const email = req.nextUrl.searchParams.get("email");
    const validation = statusQuerySchema.safeParse({ email });

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Email tidak valid" },
        { status: 400 },
      );
    }

    const request = await db.query.passwordResetRequests.findFirst({
      where: eq(passwordResetRequests.email, validation.data.email),
      orderBy: (requests, { desc }) => [desc(requests.requestedAt)],
    });

    if (!request) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({
      success: true,
      data: {
        email: request.email,
        status: request.status,
        requestedAt: request.requestedAt,
        resolvedAt: request.resolvedAt ?? null,
      },
    });
  } catch (error) {
    console.error("fetch password reset status error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memeriksa status reset password" },
      { status: 500 },
    );
  }
}
