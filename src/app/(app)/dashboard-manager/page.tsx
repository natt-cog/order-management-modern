import Link from "next/link";
import { requireRole } from "@/lib/auth";
import * as q from "@/lib/queries/dashboard";
import { BarChart, GoalProgress, TopPerformers, TopProducts, monthLabel } from "@/components/dashboard";
import { OrdersTabs } from "@/components/OrdersTabs";

export default async function DashboardManager() {
  const s = await requireRole(["OrderManager"]);
  const [props, submitted, performers, products, history, categories] = await Promise.all([
    q.getSiteProperties(), q.submittedOrders(), q.topPerformers(), q.topProducts(),
    q.salesHistory(), q.amountByCategory(),
  ]);
  const g = q.goals(props);
  return (
    <>
      <div className="page-title"><h1>Welcome, {s.name}</h1><Link className="btn" href="/orders/new">New Order</Link></div>
      <div className="grid grid-2">
        <BarChart title="Order Sales" points={history.map((h) => ({ label: monthLabel(h.month), value: Number(h.amount) }))} />
        <BarChart title="Top 5 Categories" points={categories.map((c) => ({ label: c.name, value: Number(c.amount) }))} />
      </div>
      <div className="grid grid-2">
        <GoalProgress title="Team Goal" {...g.teamManager} />
        <GoalProgress title="Company Goal" {...g.company} />
      </div>
      {/* O11 の OrdersBySalesManager には Opportunities タブもあるが、実機では表示されない（見出しも出ない）ため出さない */}
      <OrdersTabs tabs={[{ title: "Submitted orders", rows: submitted, empty: "No submitted orders..." }]} />
      <TopPerformers rows={performers} />
      <TopProducts rows={products} />
    </>
  );
}
