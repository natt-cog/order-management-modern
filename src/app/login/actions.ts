"use server";
import { redirect } from "next/navigation";
import { eq, inArray } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { db, schema as s } from "@/db";
import { loadSessionFor, signIn, signOut, isManager } from "@/lib/auth";

export const SAMPLE_USERNAMES = [
  "manuel.luis@observeverything.example",
  "ana.martins@observeverything.example",
  "jose.felix@observeverything.example",
];

async function landing(userId: number) {
  const session = await loadSessionFor(userId);
  redirect(session && isManager(session) ? "/dashboard-manager" : "/dashboard");
}

/** DoLogin: User_Login(Username, Password, RememberLogin) */
export async function doLogin(_: string | null, form: FormData): Promise<string | null> {
  const username = String(form.get("username") ?? "").trim();
  const password = String(form.get("password") ?? "");
  const remember = form.get("remember") === "on";
  const [u] = await db.select().from(s.users).where(eq(s.users.username, username));
  if (!u || !u.isActive || !u.passwordHash || !(await bcrypt.compare(password, u.passwordHash)))
    return "Invalid username or password.";
  await signIn(u.id, remember);
  await landing(u.id);
  return null;
}

/** Login_SampleUser: SampleUsers_Get に含まれるユーザーのみ、persistent=False でログイン */
export async function loginSampleUser(userId: number) {
  const users = await db.select().from(s.users).where(inArray(s.users.username, SAMPLE_USERNAMES));
  if (!users.some((u) => u.id === userId && u.isActive)) return;
  await signIn(userId, false);
  await landing(userId);
}

/** DoLogout */
export async function doLogout() {
  await signOut();
  redirect("/login");
}
