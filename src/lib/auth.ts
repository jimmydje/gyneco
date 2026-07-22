import { jwtVerify, SignJWT } from "jose";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "gyneco-admin-secret-change-me"
);
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const TOKEN_NAME = "gyneco-admin-token";

export function checkAdminPassword(pw: string) {
  return pw === ADMIN_PASSWORD;
}

export async function createAdminToken() {
  const token = await new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET);
  return token;
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function isAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const token = cookieStore.get(TOKEN_NAME)?.value;
  if (!token) return false;
  return verifyAdminToken(token);
}

export async function setAdminCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(TOKEN_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24h
  });
}

export async function clearAdminCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(TOKEN_NAME);
}
