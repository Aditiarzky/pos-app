import { validateUserData } from "@/lib/validations/user";
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userRoles } from "@/drizzle/schema";
import { eq } from "drizzle-orm";
import { hash } from "bcryptjs";
import { createSession } from "@/lib/auth";
import { UserRoleEnumType } from "@/drizzle/type";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const validation = validateUserData(body);

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

    const { email, name, password, roles: rolesInput } = validation.data;

    // Validasi password
    if (!password) {
      return NextResponse.json(
        { success: false, error: "Missing password" },
        { status: 400 },
      );
    }

    // Cek apakah email sudah terdaftar
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, email),
    });

    if (existingUser) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 409 },
      );
    }

    // Hash password
    const hashedPassword = await hash(password, 10);

    const result = await db.transaction(async (tx) => {
      // 1. Insert user
      const [newUser] = await tx
        .insert(users)
        .values({
          email,
          name,
          password: hashedPassword,
          updatedAt: new Date(),
        })
        .returning();

      // 2. Insert roles
      const finalRoles =
        rolesInput && rolesInput.length > 0 ? rolesInput : ["admin toko"];

      await tx.insert(userRoles).values(
        finalRoles.map((r) => ({
          userId: newUser.id,
          role: r as UserRoleEnumType,
        })),
      );

      return { ...newUser, roles: finalRoles };
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = result;

    await createSession({
      id: result.id,
      email: result.email,
      name: result.name,
      roles: result.roles as UserRoleEnumType[],
    });

    return NextResponse.json(
      { success: true, data: userWithoutPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to register user" },
      { status: 500 },
    );
  }
}
