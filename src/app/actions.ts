"use server";
import { AuthError } from "next-auth";
import { signIn, signOut } from "@/auth";

export async function login(_prev: string | undefined, form: FormData) {
  try {
    await signIn("credentials", { username: form.get("username"), password: form.get("password"), redirectTo: "/" });
  } catch (e) {
    if (e instanceof AuthError) return "Invalid username or password.";
    throw e;
  }
}

export async function logout() {
  await signOut({ redirectTo: "/login" });
}
