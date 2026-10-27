import { redirect } from "next/navigation";
import { getSession, isManager } from "@/lib/auth";

/** Splash 相当: ログイン済みならロールに応じたダッシュボードへ */
export default async function Home() {
  const s = await getSession();
  if (!s) redirect("/login");
  redirect(isManager(s) ? "/dashboard-manager" : "/dashboard");
}
