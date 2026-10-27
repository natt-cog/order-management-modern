import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SignJWT, jwtVerify } from "jose";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";

export type Role = "OrderManager" | "OrderRepresentative";
export type Session = { userId: number; name: string; roles: Role[] };

const COOKIE = "om_session";
const secret = () => new TextEncoder().encode(process.env.SESSION_SECRET ?? "dev-only-secret-change-me-please-32bytes");

export async function loadSessionFor(userId: number): Promise<Session | null> {
  const [u] = await db.select().from(schema.users).where(eq(schema.users.id, userId));
  if (!u || !u.isActive) return null;
  const roles = await db.select().from(schema.userRoles).where(eq(schema.userRoles.userId, userId));
  return { userId: u.id, name: u.name, roles: roles.map((r) => r.role as Role) };
}

/** Users.User_Login(RememberLogin=True) 相当: 署名付き Cookie にユーザー ID を保存 */
export async function signIn(userId: number, remember = true) {
  const token = await new SignJWT({ uid: userId }).setProtectedHeader({ alg: "HS256" }).setIssuedAt()
    .setExpirationTime(remember ? "30d" : "12h").sign(secret());
  (await cookies()).set(COOKIE, token, {
    httpOnly: true, sameSite: "lax", path: "/", secure: process.env.NODE_ENV === "production",
    ...(remember ? { maxAge: 60 * 60 * 24 * 30 } : {}),
  });
}

export async function signOut() {
  (await cookies()).delete(COOKIE);
}

export async function getSession(): Promise<Session | null> {
  const token = (await cookies()).get(COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, secret());
    return await loadSessionFor(Number(payload.uid));
  } catch {
    return null;
  }
}

export const isManager = (s: Session) => s.roles.includes("OrderManager");
export const isRepresentative = (s: Session) => s.roles.includes("OrderRepresentative");

/** 画面の Roles 設定相当: 未ログインは Login へ、権限不足は InvalidPermissions へ */
export async function requireRole(roles: Role[] = ["OrderManager", "OrderRepresentative"]): Promise<Session> {
  const s = await getSession();
  if (!s) redirect("/login");
  if (!s.roles.some((r) => roles.includes(r))) redirect("/invalid-permissions");
  return s;
}
