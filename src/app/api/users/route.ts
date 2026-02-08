import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users, userRoles } from "@/drizzle/schema";
import { eq, sql, and, exists } from "drizzle-orm";
import { hash } from "bcryptjs";
import { validateUserData } from "@/lib/validations/user";
import { verifySession } from "@/lib/auth";
import { UserRoleEnumType } from "@/drizzle/type";
import {
  formatMeta,
  getSearchAndOrderFTS,
  parsePagination,
} from "@/lib/query-helper";

export async function GET(request: NextRequest) {
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
    const params = parsePagination(request);
    const role = request.nextUrl.searchParams.get("role");

    const { searchFilter, searchOrder } = getSearchAndOrderFTS(
      params.search,
      params.order,
      params.orderBy,
      users,
    );

    let finalFilter = and(searchFilter, eq(users.isActive, true));

    if (role && role !== "all") {
      finalFilter = and(
        finalFilter,
        exists(
          db
            .select()
            .from(userRoles)
            .where(
              and(
                eq(userRoles.userId, users.id),
                eq(userRoles.role, role as UserRoleEnumType),
              ),
            ),
        ),
      );
    }

    const usersData = await db.query.users.findMany({
      where: finalFilter,
      with: {
        roles: true,
      },
      orderBy: searchOrder,
      limit: params.limit,
      offset: params.offset,
    });

    const totalRes = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(finalFilter);
    const totalCount = Number(totalRes[0]?.count || 0);

    return NextResponse.json({
      success: true,
      data: usersData,
      pagination: formatMeta(totalCount, params.page, params.limit),
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
            role: r as UserRoleEnumType,
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
