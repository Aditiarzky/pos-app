import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userRoles } from "@/drizzle/schema";
import { eq, desc, sql } from "drizzle-orm";
import { hash } from "bcryptjs";
import { validateUserData } from "@/lib/validations/user";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    const usersData = await db.query.users.findMany({
      with: {
        roles: true,
      },
      orderBy: [desc(users.createdAt)],
      limit: limit,
      offset: offset,
    });

    const totalRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(users);
    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: usersData,
      pagination: {
        page,
        limit,
        total: totalCount,
        totalPages: Math.ceil(totalCount / limit),
      },
    });
  } catch (error) {
    console.error("fetch users error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch users" },
      { status: 500 },
    );
  }
}

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
      if (rolesInput && rolesInput.length > 0) {
        await tx.insert(userRoles).values(
          rolesInput.map((r) => ({
            userId: newUser.id,
            role: r as any,
          })),
        );
      }

      return newUser;
    });

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...userWithoutPassword } = result;

    return NextResponse.json(
      { success: true, data: userWithoutPassword },
      { status: 201 },
    );
  } catch (error) {
    console.error("Create user error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create user" },
      { status: 500 },
    );
  }
}
