// O11 の SiteProperty Currency="€", DecimalSeparator=".", GroupSeparator="," に合わせた表示
const money = new Intl.NumberFormat("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatCurrency(v: number | string | null | undefined): string {
  // O11 実機表示（toFixed 相当: 倍精度の実値で丸め）に合わせる: 20629.405 → 20,629.40
  return `€${money.format(Number(Number(v ?? 0).toFixed(2)))}`;
}

/** PrettyFormatCurrency(Value, Decimals=0) 相当: 1,000 以上は k 表記 ("€50k", "€2,719k") */
export function formatPretty(v: number | string | null | undefined, decimals = 0): string {
  const n = Number(v ?? 0);
  const f = new Intl.NumberFormat("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  return Math.abs(n) >= 1000 ? `€${f.format(n / 1000)}k` : `€${f.format(n)}`;
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

const pad = (n: number) => String(n).padStart(2, "0");

/** O11 の Date をそのまま出す表示（例: 2020-04-09） */
export function formatO11Date(v: Date | string | null | undefined): string {
  if (!v) return "";
  if (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v)) return v;
  const d = new Date(v);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** O11 の DateTime をそのまま出す表示（例: 2020-04-01 00:00:00） */
export function formatO11DateTime(v: Date | string | null | undefined): string {
  if (!v) return "";
  const d = new Date(typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) ? `${v}T00:00:00` : v);
  return `${formatO11Date(d)} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

/** O11 の Decimal / Currency を書式なしで出す表示（例: 1675） */
export function formatO11Number(v: number | string | null | undefined): string {
  return v == null ? "" : String(Number(v));
}
