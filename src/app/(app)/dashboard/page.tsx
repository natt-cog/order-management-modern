import { requireUser } from "@/lib/session";
import { SITE, salesByCategory, salesByMonth } from "@/lib/dashboard";
import { listOrders } from "@/lib/order-queries";
import { Bars, MONTHS } from "@/components/bars";
import { OrdersTable } from "@/components/orders-table";
import { money } from "@/lib/format";

// Dashboard (sales representative): own closed sales vs personal goal, by month and category, own submitted orders
export default async function Dashboard() {
  const user = await requireUser();
  const [months, cats, submitted] = await Promise.all([salesByMonth(3, user.id), salesByCategory(user.id), listOrders({ status: 2, employee: user.id })]);
  const closed = months.reduce((s, m) => s + m.total, 0);
  const pct = Math.min(100, Math.round((closed / SITE.personalGoal) * 100));
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section className="rounded-lg bg-white p-4 shadow" data-testid="personal-goal">
        <p className="text-sm text-slate-500">Personal goal {money(SITE.personalGoal)}</p>
        <p className="text-2xl font-semibold">{money(closed)} <span className="text-base text-slate-500">({pct}%)</span></p>
        <div className="mt-2 h-3 rounded bg-slate-100"><div className="h-3 rounded bg-emerald-500" style={{ width: `${pct}%` }} /></div>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <Bars title="Order sales by month" rows={months.map((m) => ({ label: MONTHS[m.month - 1], value: m.total }))} />
        <Bars title="Sales by category" rows={cats.map((c) => ({ label: c.name, value: c.total }))} />
      </div>
      <h2 className="text-lg font-semibold">My submitted orders</h2>
      <OrdersTable rows={submitted} />
    </div>
  );
}
