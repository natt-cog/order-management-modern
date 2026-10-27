import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { employees, listOrders, PAGE_SIZE, type OrderListParams } from "@/lib/queries/orders";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { Pagination } from "@/components/list";

/** Invoices: Approved & Closed の注文一覧（O11 ではメニュー非表示・URL 直接アクセス） */
export default async function Invoices({ searchParams }: { searchParams: Promise<OrderListParams> }) {
  await requireRole();
  const p = await searchParams;
  const [emps, { rows, count, page }] = await Promise.all([employees(), listOrders(p, { closedOnly: true })]);
  return (
    <>
      <div className="page-title"><h1>Invoices</h1></div>
      <div className="card">
        <AutoSubmitForm className="toolbar">
          <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Search" style={{ minWidth: 280 }} />
          <select name="emp" defaultValue={p.emp ?? ""} aria-label="Employee">
            <option value="">All Employees</option>
            {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </AutoSubmitForm>
        {rows.length === 0 ? <div className="empty">There aren&apos;t any Invoices to show.</div> : (
          <table className="table">
            <thead><tr><th>Number</th><th>Account</th><th className="right">Total Amount</th><th>Employee</th><th>Order Date</th><th>Required By</th></tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id}><td><Link href={`/orders/${o.id}`}>{o.code}</Link></td><td>{o.company}</td>
                <td className="right">{formatCurrency(o.totalAmount)}</td><td>{o.createdBy}</td>
                <td>{formatDate(o.orderDate)}</td><td>{formatDate(o.requiredOn)}</td></tr>
            ))}</tbody>
          </table>
        )}
        <Pagination base="/invoices" params={p} page={page} pageSize={PAGE_SIZE} count={count} />
      </div>
    </>
  );
}
