import { NextResponse } from "next/server";
import {
  verifyRefreshToken,
  createSession,
  createRefreshToken,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { users, refreshTokens } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const validToken = await verifyRefreshToken();
    if (!validToken) {
      return NextResponse.json(
        { success: false, error: "Refresh token invalid or expired" },
        { status: 401 },
      );
    }

    // Get User Data
    const userResult = await db.query.users.findFirst({
      where: eq(users.id, validToken.userId),
      with: {
        roles: true,
      },
    });

    if (!userResult) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 401 },
      );
    }

    const userRolesList = userResult.roles.map((r) => r.role);

    // Create New Session (Access Token)
    await createSession({
      id: userResult.id,
      email: userResult.email,
      name: userResult.name,
      roles: userRolesList,
    });

    // Optional: Rotate Refresh Token (Delete old, create new)
    // For better security, we rotate it.
    await db.delete(refreshTokens).where(eq(refreshTokens.id, validToken.id));
    await createRefreshToken(userResult.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json(
      { success: false, error: "Refresh failed" },
      { status: 500 },
    );
  }
}
