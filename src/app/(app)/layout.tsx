import Link from "next/link";
import { logout } from "@/app/actions";
import { requireUser } from "@/lib/session";
import { isManager } from "@/lib/permissions";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const nav = [
    { href: isManager(user.role) ? "/dashboard-manager" : "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "Orders" },
    { href: "/invoices", label: "Invoices" },
    { href: "/products", label: "Catalog" },
    { href: "/accounts", label: "Accounts" },
    { href: "/opportunities", label: "Opportunities" },
  ];
  return (
    <div>
      <header className="bg-sky-800 text-white">
        <div className="mx-auto flex max-w-7xl items-center gap-6 px-6 py-3">
          <Link href="/" className="text-lg font-semibold">Order Management</Link>
          <nav className="flex gap-4 text-sm">{nav.map((n) => <Link key={n.href} href={n.href} className="hover:underline">{n.label}</Link>)}</nav>
          <div className="ml-auto flex items-center gap-3 text-sm">
            <span data-testid="current-user">{user.name}</span>
            <form action={logout}><button className="rounded border border-white/40 px-2 py-1 hover:bg-white/10">Logout</button></form>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-6 py-6">{children}</main>
    </div>
  );
}
