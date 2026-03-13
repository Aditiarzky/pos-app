import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { passwordResetRequests, users } from "@/drizzle/schema";
import { verifySession } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";

const DEFAULT_PASSWORD = "Password123";

export async function PUT(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const session = await verifySession();
    if (!session) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 },
      );
    }

    if (!session.roles.includes("admin sistem")) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 },
      );
    }

    const requestId = Number((await params).id);
    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Invalid request id" },
        { status: 400 },
      );
    }

    const resetRequest = await db.query.passwordResetRequests.findFirst({
      where: eq(passwordResetRequests.id, requestId),
    });

    if (!resetRequest) {
      return NextResponse.json(
        { success: false, error: "Permintaan tidak ditemukan" },
        { status: 404 },
      );
    }

    if (resetRequest.status !== "pending") {
      return NextResponse.json(
        { success: false, error: "Permintaan sudah diproses" },
        { status: 400 },
      );
    }

    const hashedPassword = await hash(DEFAULT_PASSWORD, 10);
    const now = new Date();

    await db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({
          password: hashedPassword,
          updatedAt: now,
        })
        .where(eq(users.id, resetRequest.userId));

      await tx
        .update(passwordResetRequests)
        .set({
          status: "completed",
          resolvedAt: now,
          resolvedBy: session.userId,
        })
        .where(eq(passwordResetRequests.id, requestId));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("resolve password reset error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses reset password" },
      { status: 500 },
    );
  }
}
