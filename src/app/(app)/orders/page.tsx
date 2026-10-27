import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import { amountRange, employees, listOrders, PAGE_SIZE, type OrderListParams } from "@/lib/queries/orders";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { hrefWith, Pagination, SortHeader } from "@/components/list";

const TABS = [
  { label: "All", status: undefined }, { label: "Draft", status: "1" },
  { label: "Submitted", status: "2" }, { label: "Approved & Closed", status: "3" },
];

export default async function Orders({ searchParams }: { searchParams: Promise<OrderListParams> }) {
  await requireRole();
  const p = await searchParams;
  const [range, emps, { rows, count, page }] = await Promise.all([amountRange(), employees(), listOrders(p)]);
  const base = "/orders";
  return (
    <>
      <div className="page-title"><h1>Orders</h1><Link className="btn" href="/orders/new">New Order</Link></div>
      <div className="card">
        <AutoSubmitForm className="toolbar">
          <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Search by order number or company" style={{ minWidth: 280 }} />
          <select name="emp" defaultValue={p.emp ?? ""} aria-label="Employee">
            <option value="">All Employees</option>
            {emps.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
          <span className="muted">Amount</span>
          <input type="number" name="min" aria-label="Min amount" defaultValue={p.min ?? range.min} min={range.min} max={range.max} step={100} style={{ width: 110 }} />
          <span>–</span>
          <input type="number" name="max" aria-label="Max amount" defaultValue={p.max ?? range.max} min={range.min} max={range.max} step={100} style={{ width: 110 }} />
          <span className="muted" data-testid="amount-range">{formatCurrency(range.min)} – {formatCurrency(range.max)}</span>
          {p.status && <input type="hidden" name="status" value={p.status} />}
          {p.sort && <input type="hidden" name="sort" value={p.sort} />}
        </AutoSubmitForm>
        <div className="tabs">{TABS.map((t) => (
          <Link key={t.label} className={(p.status ?? undefined) === t.status ? "active" : ""} href={hrefWith(base, p, { status: t.status, page: undefined })}>{t.label}</Link>
        ))}</div>
        {rows.length === 0 ? <div className="empty">There aren&apos;t any Orders to show.</div> : (
          <table className="table" data-testid="orders-table">
            <thead><tr>
              <SortHeader base={base} params={p} field="number" label="Number" />
              <SortHeader base={base} params={p} field="company" label="Company" />
              <SortHeader base={base} params={p} field="amount" label="Total Amount" className="right" />
              <SortHeader base={base} params={p} field="date" label="Order Date" />
              <SortHeader base={base} params={p} field="required" label="Required On" />
              <SortHeader base={base} params={p} field="createdby" label="Created by" />
              <SortHeader base={base} params={p} field="state" label="State" />
            </tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id}>
                <td><Link href={`/orders/${o.id}`}>{o.code}</Link></td><td>{o.company}</td>
                <td className="right">{formatCurrency(o.totalAmount)}</td><td>{formatDate(o.orderDate)}</td>
                <td>{formatDate(o.requiredOn)}</td><td>{o.createdBy}</td>
                <td><span className="badge" style={{ background: o.statusColor ?? undefined }}>{o.status}</span></td>
              </tr>
            ))}</tbody>
          </table>
        )}
        <Pagination base={base} params={p} page={page} pageSize={PAGE_SIZE} count={count} />
      </div>
    </>
  );
}
