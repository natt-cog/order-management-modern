import Link from "next/link";
import { requireManager } from "@/lib/session";
import { SITE, salesByCategory, salesByMonth, topPerformers, topProducts } from "@/lib/dashboard";
import { listOrders } from "@/lib/order-queries";
import { Bars, MONTHS } from "@/components/bars";
import { OrdersTable } from "@/components/orders-table";

// DashboardManager: team goal, sales history, categories, submitted orders to approve, top performers / products
export default async function DashboardManager() {
  await requireManager();
  const [months, cats, submitted, perf, prods] = await Promise.all([salesByMonth(3), salesByCategory(), listOrders({ status: 2 }), topPerformers(), topProducts()]);
  return (
    <div className="space-y-5">
      <h1 className="text-2xl font-semibold">Dashboard</h1>
      <section className="rounded-lg bg-white p-4 shadow" data-testid="team-goal">
        <p className="text-sm text-slate-500">Team goal</p>
        <p className="text-2xl font-semibold">{SITE.teamGoalPercent}%</p>
        <div className="mt-2 h-3 rounded bg-slate-100"><div className="h-3 rounded bg-emerald-500" style={{ width: `${SITE.teamGoalPercent}%` }} /></div>
      </section>
      <div className="grid gap-5 md:grid-cols-2">
        <Bars title="Order sales by month" rows={months.map((m) => ({ label: MONTHS[m.month - 1], value: m.total }))} />
        <Bars title="Sales by category" rows={cats.map((c) => ({ label: c.name, value: c.total }))} />
        <Bars title="Top performers" rows={perf.map((p) => ({ label: p.name, value: p.total }))} />
        <section className="rounded-lg bg-white p-4 shadow">
          <h2 className="mb-3 font-semibold">Top products</h2>
          <ol className="list-decimal pl-5 text-sm">{prods.map((p) => <li key={p.id} className="capitalize"><Link href={`/products/${p.id}`} className="text-sky-700 hover:underline">{p.name}</Link> — {p.qty} units</li>)}</ol>
        </section>
      </div>
      <h2 className="text-lg font-semibold">Submitted orders</h2>
      <OrdersTable rows={submitted} />
    </div>
  );
}
