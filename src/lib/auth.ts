import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextRequest } from "next/server";

const secretKey = process.env.JWT_SECRET!;
const encodedKey = new TextEncoder().encode(secretKey);

export interface SessionPayload {
  userId: number;
  email: string;
  name: string;
  roles: string[];
  iat: number;
  exp: number;
}

// Buat JWT & set cookie
export async function createSession(user: {
  id: number;
  email: string;
  name: string;
  roles: string[];
}) {
  const expiresAt = new Date(Date.now() + 30 * 60 * 1000);

  const token = await new SignJWT({
    userId: user.id,
    email: user.email,
    name: user.name,
    roles: user.roles,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresAt)
    .sign(encodedKey);

  (await cookies()).set("auth_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

// Verify JWT dari cookie
export async function verifySession(): Promise<SessionPayload | null> {
  const cookie = (await cookies()).get("auth_token")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, encodedKey, {
      algorithms: ["HS256"],
    });
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

import { db } from "@/lib/db";
import { refreshTokens } from "@/drizzle/schema";
import { eq } from "drizzle-orm";

// Hapus session (logout)
export async function deleteSession() {
  const cookieStore = await cookies();
  const refreshToken = cookieStore.get("refresh_token")?.value;

  if (refreshToken) {
    await db.delete(refreshTokens).where(eq(refreshTokens.token, refreshToken));
    cookieStore.delete("refresh_token");
  }
  cookieStore.delete("auth_token");
}

export async function createRefreshToken(userId: number) {
  const token = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

  await db.insert(refreshTokens).values({
    token,
    userId,
    expiresAt,
  });

  (await cookies()).set("refresh_token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    expires: expiresAt,
    path: "/",
  });
}

export async function verifyRefreshToken() {
  const token = (await cookies()).get("refresh_token")?.value;
  if (!token) return null;

  const savedToken = await db.query.refreshTokens.findFirst({
    where: eq(refreshTokens.token, token),
  });

  if (!savedToken || savedToken.expiresAt < new Date()) {
    return null;
  }

  return savedToken;
}

// Untuk middleware
export async function getSessionFromRequest(
  req: NextRequest,
): Promise<SessionPayload | null> {
  const cookie = req.cookies.get("auth_token")?.value;
  if (!cookie) return null;

  try {
    const { payload } = await jwtVerify(cookie, encodedKey);
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}
