import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { canUseOrders, isManager, type Role } from "@/lib/permissions";

export async function requireUser() {
  const session = await auth();
  if (!session?.user) redirect("/login");
  const user = { id: Number(session.user.id), name: session.user.name ?? "", role: session.user.role as Role };
  if (!canUseOrders(user.role)) redirect("/invalid-permissions");
  return user;
}

export async function requireManager() {
  const user = await requireUser();
  if (!isManager(user.role)) redirect("/invalid-permissions");
  return user;
}
