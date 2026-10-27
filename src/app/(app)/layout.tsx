import Link from "next/link";
import { requireRole, isManager } from "@/lib/auth";
import { doLogout } from "@/app/login/actions";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const s = await requireRole();
  const menu = [
    { href: isManager(s) ? "/dashboard-manager" : "/dashboard", label: "Dashboard" },
    { href: "/orders", label: "Orders" },
    { href: "/products", label: "Catalog" },
    { href: "/accounts", label: "Accounts" },
    { href: "/opportunities", label: "Opportunities" },
  ];
  return (
    <div className="shell">
      <nav className="sidebar">
        <div className="brand">ACME</div>
        {menu.map((m) => <Link key={m.href} href={m.href}>{m.label}</Link>)}
      </nav>
      <div className="main">
        <header className="header">
          <span className="muted">{isManager(s) ? "Sales manager" : "Sales representative"}</span>
          <span style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <strong data-testid="user-name">{s.name}</strong>
            <form action={doLogout}><button className="btn-link">Logout</button></form>
          </span>
        </header>
        <main className="content">{children}</main>
      </div>
    </div>
  );
}
