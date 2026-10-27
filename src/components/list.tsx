import Link from "next/link";

type Params = Record<string, string | undefined>;

export function hrefWith(base: string, params: Params, patch: Params) {
  const u = new URLSearchParams();
  for (const [k, v] of Object.entries({ ...params, ...patch })) if (v) u.set(k, v);
  const qs = u.toString();
  return qs ? `${base}?${qs}` : base;
}

/** 列見出しクリックで昇順 → 降順（OrderTableOnSort: TableSort = SortBy / += " DESC"） */
export function SortHeader({ base, params, field, label, className }: { base: string; params: Params; field: string; label: string; className?: string }) {
  const cur = params.sort ?? "";
  const next = cur === field ? `${field}.desc` : field;
  const mark = cur === field ? " ▲" : cur === `${field}.desc` ? " ▼" : "";
  return <th className={className}><Link href={hrefWith(base, params, { sort: next, page: undefined })}>{label}{mark}</Link></th>;
}

/** OutSystemsUI Pagination: "1 to 20 of 58 items" */
export function Pagination({ base, params, page, pageSize, count }: { base: string; params: Params; page: number; pageSize: number; count: number }) {
  if (count === 0) return null;
  const pages = Math.ceil(count / pageSize);
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);
  return (
    <div className="pagination">
      <span data-testid="pagination-counter">{from} to {to} of {count} items</span>
      <span className="pages">{Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        n === page ? <strong key={n}>{n}</strong> : <Link key={n} href={hrefWith(base, params, { page: String(n) })}>{n}</Link>
      ))}</span>
    </div>
  );
}
