// O11 の SiteProperty Currency="€", DecimalSeparator=".", GroupSeparator="," に合わせた表示
const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatCurrency(v: number | string | null | undefined): string {
  return `€${money.format(Number(v ?? 0))}`;
}

/** Dashboard の "€50k" / "€2.719k" 表記（Decimal_FormatPretty 相当） */
export function formatPretty(v: number | string | null | undefined): string {
  const n = Number(v ?? 0);
  if (Math.abs(n) >= 1000) return `€${Number((n / 1000).toFixed(3))}k`;
  return `€${Number(n.toFixed(2))}`;
}

function toDate(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  const d = typeof v === "string" ? new Date(v.length === 10 ? `${v}T00:00:00Z` : v) : v;
  return Number.isNaN(d.getTime()) ? null : d;
}

/** "9 Apr 2020" */
export function formatDate(v: Date | string | null | undefined): string {
  const d = toDate(v);
  return d ? `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}` : "";
}

/** <input type="date"> 用 yyyy-mm-dd */
export function toInputDate(v: Date | string | null | undefined): string {
  const d = toDate(v);
  return d ? d.toISOString().slice(0, 10) : "";
}
