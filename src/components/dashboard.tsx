import Link from "next/link";
import { formatCurrency, formatPretty } from "@/lib/format";

export function GoalProgress({ title, goal, current }: { title: string; goal: number; current: number }) {
  const pct = goal ? (current / goal) * 100 : 0;
  return (
    <div className="card" data-testid={`goal-${title}`}>
      <div className="muted">{title}</div>
      <div className="counter">{formatPretty(goal)}</div>
      <div className="progress"><div style={{ width: `${Math.min(100, pct)}%` }} /></div>
      <div className="muted" style={{ marginTop: 6 }}>Current {formatPretty(current)} ({Math.round(pct)}%)</div>
    </div>
  );
}

type OrderRow = { id: number; code: string; company: string; totalAmount: string | null; status: string; statusColor: string | null };

export function OrdersList({ title, rows, empty, showStatus = false }: { title: string; rows: OrderRow[]; empty: string; showStatus?: boolean }) {
  return (
    <div className="card" data-testid={`list-${title}`}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <strong>{title}</strong><span className="counter" style={{ fontSize: 20 }}>{rows.length}</span>
      </div>
      {rows.length === 0 ? <div className="empty">{empty}</div> : (
        <table className="table">
          <thead><tr><th>Order Number</th><th className="right">Amount</th>{showStatus && <th>Status</th>}</tr></thead>
          <tbody>{rows.slice(0, 5).map((o) => (
            <tr key={o.id}><td><Link href={`/orders/${o.id}`}>{o.code}</Link><div className="muted">{o.company}</div></td>
              <td className="right">{formatCurrency(o.totalAmount)}</td>
              {showStatus && <td><span className="badge" style={{ background: o.statusColor ?? undefined }}>{o.status}</span></td>}</tr>
          ))}</tbody>
        </table>
      )}
    </div>
  );
}

export function TopPerformers({ rows }: { rows: { id: number; name: string; amount: string }[] }) {
  return (
    <div className="card" data-testid="top-performers">
      <strong>Top performers</strong>
      <table className="table">
        <thead><tr><th>Ranking</th><th>Name</th><th className="right">Amount</th></tr></thead>
        <tbody>{rows.map((r, i) => (
          <tr key={r.id}><td>{i + 1}</td><td>{r.name}</td><td className="right">{formatPretty(r.amount)}</td></tr>
        ))}</tbody>
      </table>
    </div>
  );
}

export function TopProducts({ rows }: { rows: { id: number; name: string; reference: string | null; stock: number | null }[] }) {
  return (
    <div className="card" data-testid="top-products">
      <strong>Top products</strong>
      {rows.length === 0 ? <div className="empty">There are no products to display.</div> : (
        <div className="grid grid-4" style={{ marginTop: 12 }}>{rows.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="product-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/products/${p.id}/cover`} alt={p.name} />
            <div><strong>{p.name}</strong></div>
            <div className="muted">REF {p.reference}</div>
            <div className="muted">{p.stock} in stock</div>
          </Link>
        ))}</div>
      )}
    </div>
  );
}

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

/** Order Sales / Top 5 Categories（O11 は Charts の H.each エラーで描画不可。移行版は SVG で描画） */
export function BarChart({ title, points }: { title: string; points: { label: string; value: number }[] }) {
  const max = Math.max(1, ...points.map((p) => p.value));
  return (
    <div className="card" data-testid={`chart-${title}`}>
      <strong>{title}</strong>
      {points.length === 0 ? <div className="empty">No data to display</div> : (
        <svg viewBox={`0 0 ${points.length * 60} 180`} style={{ width: "100%", height: 200 }}>
          {points.map((p, i) => {
            const h = (p.value / max) * 140;
            return (
              <g key={p.label}>
                <rect x={i * 60 + 10} y={150 - h} width={40} height={h} fill="#1068eb" />
                <text x={i * 60 + 30} y={168} fontSize="10" textAnchor="middle">{p.label}</text>
                <text x={i * 60 + 30} y={145 - h} fontSize="9" textAnchor="middle">{formatPretty(p.value)}</text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
}

export const monthLabel = (m: number) => MONTHS[m - 1];
