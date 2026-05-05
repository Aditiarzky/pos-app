import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { passwordResetRequests, users } from "@/drizzle/schema";
import { and, eq } from "drizzle-orm";

const forgotPasswordSchema = z.object({
  email: z.string().email("Email tidak valid"),
});

export async function POST() {
  return NextResponse.json(
    {
      success: false,
      error:
        "Fitur lupa password dinonaktifkan. Silakan hubungi admin sistem untuk reset password.",
    },
    { status: 403 },
  );
}
