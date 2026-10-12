import Link from "next/link";
import { money, day } from "@/lib/format";

type Row = { id: number; code: string; company: string; total: number; status: string; color: string | null; expected: string | null; employee: string | null };

export function StatusBadge({ label, color }: { label: string; color: string | null }) {
  return <span className="rounded-full px-2 py-0.5 text-xs font-medium text-white" style={{ background: color ?? "#64748b" }}>{label}</span>;
}

export function OrdersTable({ rows, sortHref }: { rows: Row[]; sortHref?: (col: string) => string }) {
  const th = (col: string, label: string) => <th className="px-3 py-2 text-left">{sortHref ? <Link href={sortHref(col)} className="hover:underline">{label}</Link> : label}</th>;
  return (
    <table className="w-full overflow-hidden rounded-lg bg-white text-sm shadow" data-testid="orders-table">
      <thead className="bg-slate-100 text-slate-600"><tr>{th("code", "Order")}{th("company", "Company")}{th("employee", "Employee")}{th("expected", "Expected close")}{th("status", "Status")}{th("total", "Total")}</tr></thead>
      <tbody>
        {rows.map((r) => (
          <tr key={r.id} className="border-t hover:bg-slate-50">
            <td className="px-3 py-2"><Link href={`/orders/${r.id}`} className="font-medium text-sky-700 hover:underline">{r.code}</Link></td>
            <td className="px-3 py-2">{r.company}</td>
            <td className="px-3 py-2">{r.employee ?? "-"}</td>
            <td className="px-3 py-2">{day(r.expected)}</td>
            <td className="px-3 py-2"><StatusBadge label={r.status} color={r.color} /></td>
            <td className="px-3 py-2 text-right">{money(r.total)}</td>
          </tr>
        ))}
        {rows.length === 0 && <tr><td colSpan={6} className="px-3 py-8 text-center text-slate-500">No orders to show</td></tr>}
      </tbody>
    </table>
  );
}
