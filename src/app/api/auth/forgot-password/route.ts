import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetRequests, users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = forgotPasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        { success: false, error: "Validation failed" },
        { status: 400 },
      );
    }

    const { email } = validation.data;

    const user = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Email tidak terdaftar" },
        { status: 404 },
      );
    }

    const existingRequest = await db.query.passwordResetRequests.findFirst({
      where: and(
        eq(passwordResetRequests.userId, user.id),
        eq(passwordResetRequests.status, "pending"),
      ),
    });

    if (existingRequest) {
      return NextResponse.json({ success: true, data: existingRequest });
    }

    const [createdRequest] = await db
      .insert(passwordResetRequests)
      .values({
        userId: user.id,
        email: user.email,
        status: "pending",
      })
      .returning();

    return NextResponse.json({ success: true, data: createdRequest });
  } catch (error) {
    console.error("forgot password error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat permintaan reset password" },
      { status: 500 },
    );
  }
}
