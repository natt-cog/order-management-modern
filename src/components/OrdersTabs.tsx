"use client";

import Link from "next/link";
import { useState } from "react";
import { formatCurrency } from "@/lib/format";

type OrderRow = { id: number; code: string; company: string; totalAmount: string | null };
type Tab = { title: string; rows: OrderRow[]; empty: string };

/** Dashboard_OrdersBySalesRepresentative / Manager: タブ見出しに件数、選択中のタブだけ一覧を表示 */
export function OrdersTabs({ tabs }: { tabs: Tab[] }) {
  const [active, setActive] = useState(0);
  const t = tabs[active];
  return (
    <div className="card" data-testid="dashboard-orders">
      <strong>Orders</strong>
      <div className="tabs" role="tablist">
        {tabs.map((x, i) => (
          <button key={x.title} type="button" role="tab" aria-selected={i === active} className={i === active ? "active" : ""} onClick={() => setActive(i)}>
            {x.title} <span className="counter" style={{ fontSize: 16 }}>{x.rows.length}</span>
          </button>
        ))}
      </div>
      {t.rows.length === 0 ? <div className="empty">{t.empty}</div> : (
        <table className="table">
          <thead><tr><th>Order Number</th><th className="right">Amount</th></tr></thead>
          <tbody>{t.rows.map((o) => (
            <tr key={o.id}><td><Link href={`/orders/${o.id}`}>{o.code}</Link><div className="muted">{o.company}</div></td>
              <td className="right">{formatCurrency(o.totalAmount)}</td></tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}
