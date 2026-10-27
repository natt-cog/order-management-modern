import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatCurrency } from "@/lib/format";
import * as q from "@/lib/queries/dashboard";
import { BarChart, GoalProgress, OrdersList, TopPerformers, TopProducts, monthLabel } from "@/components/dashboard";

export default async function DashboardManager() {
  const s = await requireRole(["OrderManager"]);
  const [props, submitted, opps, performers, products, history, categories] = await Promise.all([
    q.getSiteProperties(), q.submittedOrders(), q.prospectingOpportunities(), q.topPerformers(), q.topProducts(),
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
      <div className="grid grid-2">
        <OrdersList title="Submitted orders" rows={submitted} empty="No submitted orders..." />
        <div className="card" data-testid="list-opportunities">
          <strong>Opportunities</strong>
          {opps.length === 0 ? <div className="empty">No opportunities to show...</div> : (
            <table className="table"><thead><tr><th>Opportunity</th><th className="right">Amount</th></tr></thead>
              <tbody>{opps.slice(0, 5).map((o) => (
                <tr key={o.id}><td><Link href={`/opportunities/${o.id}`}>{o.name}</Link><div className="muted">{o.company}</div></td>
                  <td className="right">{formatCurrency(o.amount)}</td></tr>))}</tbody></table>
          )}
        </div>
      </div>
      <TopPerformers rows={performers} />
      <TopProducts rows={products} />
    </>
  );
}
