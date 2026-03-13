import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifySession } from "@/lib/auth";

export async function GET(_req: NextRequest) {
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

    const requests = await db.query.passwordResetRequests.findMany({
      with: {
        user: true,
        resolvedByUser: true,
      },
      orderBy: (requests, { desc }) => [desc(requests.requestedAt)],
    });

    const sanitized = requests.map((request) => {
      const { password: _userPassword, ...user } = request.user || {};
      const { password: _resolvedPassword, ...resolvedByUser } =
        request.resolvedByUser || {};

      return {
        ...request,
        user: request.user ? user : undefined,
        resolvedByUser: request.resolvedByUser ? resolvedByUser : undefined,
      };
    });

    return NextResponse.json({ success: true, data: sanitized });
  } catch (error) {
    console.error("fetch password reset requests error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch password reset requests" },
      { status: 500 },
    );
  }
}
