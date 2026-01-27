// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { compare } from "bcryptjs";
import { createSession } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email dan password wajib diisi" },
        { status: 400 },
      );
    }

    const userResult = await db.query.users.findFirst({
      where: eq(users.email, email),
      with: {
        roles: true,
      },
    });

    if (!userResult || !(await compare(password, userResult.password))) {
      return NextResponse.json(
        { success: false, error: "Email atau password salah" },
        { status: 401 },
      );
    }

    const userRolesList = userResult.roles.map((r) => r.role);

    // Buat session & set cookie
    await createSession({
      id: userResult.id,
      email: userResult.email,
      name: userResult.name,
      roles: userRolesList,
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = userResult;

    return NextResponse.json({
      success: true,
      data: userWithoutPassword,
    });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { success: false, error: "Login gagal" },
      { status: 500 },
    );
  }
}
