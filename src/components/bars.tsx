import { money } from "@/lib/format";

export function Bars({ title, rows }: { title: string; rows: { label: string; value: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-lg bg-white p-4 shadow">
      <h2 className="mb-3 font-semibold">{title}</h2>
      {rows.length === 0 && <p className="text-sm text-slate-500">No data</p>}
      {rows.map((r) => (
        <div key={r.label} className="mb-2 text-sm">
          <div className="flex justify-between"><span className="capitalize">{r.label}</span><span>{money(r.value)}</span></div>
          <div className="h-2 rounded bg-slate-100"><div className="h-2 rounded bg-sky-600" style={{ width: `${(r.value / max) * 100}%` }} /></div>
        </div>
      ))}
    </section>
  );
}
export const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
