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

// Hapus session (logout)
export async function deleteSession() {
  (await cookies()).delete("auth_token");
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
