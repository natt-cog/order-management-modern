import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";

export const dynamic = "force-dynamic";

/** OpportunityDetail: Is Closed = ClosedWon/ClosedLost, Won = ClosedWon、関連注文（最大 10 件） */
export default async function OpportunityDetail({ params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;
  const [o] = await db.select({ o: s.opportunities, company: s.accounts.company, stage: s.opportunityStages.label, stageId: s.opportunityStages.identifier })
    .from(s.opportunities).innerJoin(s.accounts, eq(s.opportunities.accountId, s.accounts.id))
    .innerJoin(s.opportunityStages, eq(s.opportunities.opportunityStageId, s.opportunityStages.id))
    .where(eq(s.opportunities.id, Number(id)));
  if (!o) notFound();
  const orders = await db.select({ id: s.orders.id, code: s.orders.code, date: s.orders.expectedClosedOn, total: s.orders.totalAmount, status: s.orderStatuses.label })
    .from(s.orders).innerJoin(s.orderStatuses, eq(s.orders.orderStatusId, s.orderStatuses.id))
    .where(and(eq(s.orders.opportunityId, o.o.id), eq(s.orders.isActive, true))).orderBy(asc(s.orders.id)).limit(10);
  const isClosed = o.stageId === "ClosedWon" || o.stageId === "ClosedLost";
  const rows: [string, React.ReactNode][] = [
    ["Account", <Link key="a" href={`/accounts/${o.o.accountId}`}>{o.company}</Link>], ["Description", o.o.description],
    ["Close Date", formatDate(o.o.closeOn)], ["Stage name", o.stage], ["Is Closed", isClosed ? "Yes" : "No"],
    ["Won", o.stageId === "ClosedWon" ? "Yes" : "No"], ["Amount", formatCurrency(o.o.amount)],
    ["Expected Revenue", formatCurrency(o.o.expectedRevenue)], ["Probability", `${Number(o.o.probability ?? 0)}%`],
  ];
  return (
    <>
      <p><Link href="/opportunities">‹ Back</Link></p>
      <div className="page-title"><h1>{o.o.name}</h1>
        <Link className="btn" href={`/orders/new?accountId=${o.o.accountId}&opportunityId=${o.o.id}`}>Create New Order for Opportunity</Link></div>
      <div className="card"><strong>Opportunity Details</strong>
        <dl className="dl" style={{ marginTop: 12 }}>{rows.map(([k, v]) => [<dt key={`${k}t`}>{k}</dt>, <dd key={`${k}d`}>{v}</dd>])}</dl></div>
      <div className="card"><strong>Orders</strong>
        {orders.length === 0 ? <div className="empty">There aren&apos;t any Orders to show.</div> : (
          <table className="table"><thead><tr><th>Number</th><th>Order Date</th><th className="right">Total Amount</th><th>Status</th></tr></thead>
            <tbody>{orders.map((r) => <tr key={r.id}><td><Link href={`/orders/${r.id}`}>{r.code}</Link></td><td>{formatDate(r.date)}</td>
              <td className="right">{formatCurrency(r.total)}</td><td>{r.status}</td></tr>)}</tbody></table>)}
      </div>
    </>
  );
}
