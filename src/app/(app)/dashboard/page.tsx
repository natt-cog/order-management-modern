import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { OrderStatus } from "@/lib/services/orders";
import * as q from "@/lib/queries/dashboard";
import { BarChart, GoalProgress, OrdersList, TopPerformers, TopProducts, monthLabel } from "@/components/dashboard";

export default async function Dashboard() {
  const s = await requireRole();
  const [props, draft, submitted, rejected, performers, products, history, categories] = await Promise.all([
    q.getSiteProperties(), q.ordersByRepresentative(s.userId, OrderStatus.Draft),
    q.ordersByRepresentative(s.userId, OrderStatus.Submitted), q.ordersByRepresentative(s.userId, OrderStatus.Rejected),
    q.topPerformers(), q.topProducts(), q.salesHistory(), q.amountByCategory(),
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
        <GoalProgress title="Personal Goal" {...g.personal} />
        <GoalProgress title="Team Goal" {...g.teamRep} />
      </div>
      <div className="grid grid-3">
        <OrdersList title="Draft orders" rows={draft} empty="No draft orders..." />
        <OrdersList title="Submitted orders" rows={submitted} empty="No on going orders..." showStatus />
        <OrdersList title="Rejected orders" rows={rejected} empty="No rejected orders..." />
      </div>
      <TopPerformers rows={performers} />
      <TopProducts rows={products} />
    </>
  );
}
