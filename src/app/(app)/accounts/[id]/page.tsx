import Link from "next/link";
import { notFound } from "next/navigation";
import { and, asc, eq, inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/queries/accounts";
import { formatCurrency, formatDate } from "@/lib/format";
import { OrderStatus } from "@/lib/services/orders";

export const dynamic = "force-dynamic";

/** AccountShow + ブロック Account_Opportunities（有効な商談）/ Account_OrdersClosed（Closed・Rejected の注文） */
export default async function AccountShow({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireRole();
  const { id } = await params;
  const { msg } = await searchParams;
  const a = await getAccount(Number(id));
  if (!a) notFound();
  const [opps, closed] = await Promise.all([
    db.select({ id: s.opportunities.id, name: s.opportunities.name, stage: s.opportunityStages.label, probability: s.opportunities.probability, amount: s.opportunities.amount })
      .from(s.opportunities).innerJoin(s.opportunityStages, eq(s.opportunities.opportunityStageId, s.opportunityStages.id))
      .where(and(eq(s.opportunities.accountId, a.id), eq(s.opportunities.isActive, true))).orderBy(asc(s.opportunities.name)),
    db.select({ id: s.orders.id, code: s.orders.code, user: s.users.name, date: s.orders.expectedClosedOn, required: s.orders.requiredOn, shipped: s.orders.shippedOn, total: s.orders.totalAmount })
      .from(s.orders).innerJoin(s.users, eq(s.orders.createdBy, s.users.id))
      .where(and(eq(s.orders.accountId, a.id), inArray(s.orders.orderStatusId, [OrderStatus.Closed, OrderStatus.Rejected]))).orderBy(asc(s.orders.code)),
  ]);
  const rows: [string, string | null][] = [
    ["Company Name", a.company], ["Primary Contact", a.contact], ["Email", a.email], ["Phone", a.phone],
    ["Code", a.code], ["Address", [a.address, a.postalCode, a.city].filter(Boolean).join(", ")], ["Country", a.country],
  ];
  return (
    <>
      <p><Link href="/accounts">‹ Back</Link></p>
      <div className="page-title"><h1>{a.company}</h1><Link className="btn btn-secondary" href={`/accounts/${a.id}/edit`}>Edit</Link></div>
      {msg && <div className="message success" role="status">Account &apos;{a.company}&apos; was successfully {msg === "created" ? "created" : "updated"}.</div>}
      <div className="card">
        <strong>Account details</strong>
        <dl className="dl" style={{ marginTop: 12 }}>{rows.map(([k, v]) => [<dt key={`${k}-t`}>{k}</dt>, <dd key={`${k}-d`}>{v}</dd>])}</dl>
      </div>
      <div className="card" data-testid="account-opportunities">
        <strong>Opportunities</strong>
        {opps.length === 0 ? <div className="empty">There aren&apos;t any Opportunities for this Account.</div> : (<>
          <table className="table"><thead><tr><th>Name</th><th>Stage</th><th className="right">Probability</th><th className="right">Amount</th></tr></thead>
            <tbody>{opps.map((o) => <tr key={o.id}><td><Link href={`/opportunities/${o.id}`}>{o.name}</Link></td><td>{o.stage}</td>
              <td className="right">{Number(o.probability ?? 0)}%</td><td className="right">{formatCurrency(o.amount)}</td></tr>)}</tbody></table>
          <div className="pagination"><span>1 to {opps.length} of {opps.length} items</span></div></>)}
      </div>
      <div className="card" data-testid="account-closed-orders">
        <strong>Closed Orders</strong>
        {closed.length === 0 ? <div className="empty">There aren&apos;t any Closed Orders for this Account.</div> : (
          <table className="table"><thead><tr><th>Number</th><th>Name</th><th>Order Date</th><th>Required Date</th><th>Shipped Date</th><th className="right">Total Amount</th></tr></thead>
            <tbody>{closed.map((o) => <tr key={o.id}><td><Link href={`/orders/${o.id}`}>{o.code}</Link></td><td>{o.user}</td><td>{formatDate(o.date)}</td>
              <td>{formatDate(o.required)}</td><td>{formatDate(o.shipped)}</td><td className="right">{formatCurrency(o.total)}</td></tr>)}</tbody></table>)}
      </div>
    </>
  );
}
