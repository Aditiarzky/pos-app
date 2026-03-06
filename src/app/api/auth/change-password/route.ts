import { NextRequest, NextResponse } from "next/server";
import { compare, hash } from "bcryptjs";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";
import { users } from "@/drizzle/schema";
import { changePasswordSchema } from "@/lib/validations/user";
import { handleApiError } from "@/lib/api-utils";

export async function PUT(request: NextRequest) {
  try {
    const session = await verifySession();

    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    const body = await request.json();
    const validation = changePasswordSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Validation failed",
          details: validation.error.format() || "Unknown error",
        },
        { status: 400 },
      );
    }

    const { currentPassword, newPassword } = validation.data;

    const user = await db.query.users.findFirst({
      where: eq(users.id, session.userId),
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 },
      );
    }

    const isCurrentPasswordValid = await compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return NextResponse.json(
        { success: false, error: "Password saat ini tidak valid" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(newPassword, 10);

    await db
      .update(users)
      .set({
        password: hashedPassword,
        updatedAt: new Date(),
      })
      .where(eq(users.id, session.userId));

    return NextResponse.json({
      success: true,
      message: "Password berhasil diperbarui",
    });
  } catch (error) {
    return handleApiError(error);
  }
}
