import Link from "next/link";
import { and, asc, desc, eq, ilike, or } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { requireRole } from "@/lib/auth";
import { formatCurrency, formatDate } from "@/lib/format";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { Pagination, SortHeader } from "@/components/list";

const PAGE = 20;
const SORTS = { opportunity: s.opportunities.name, company: s.accounts.company, amount: s.opportunities.amount,
  probability: s.opportunities.probability, close: s.opportunities.closeOn } as const;
type P = { q?: string; sort?: string; page?: string };

/** Opportunities（Open Opportunities: Prospecting のみ、最大 50 件を 20 件ずつ表示） */
export default async function Opportunities({ searchParams }: { searchParams: Promise<P> }) {
  await requireRole();
  const p = await searchParams;
  const kw = (p.q ?? "").trim();
  const [key, dir] = (p.sort ?? "company").split(".");
  const col = SORTS[key as keyof typeof SORTS] ?? s.accounts.company;
  const all = await db.select({ id: s.opportunities.id, name: s.opportunities.name, company: s.accounts.company,
    amount: s.opportunities.amount, probability: s.opportunities.probability, closeOn: s.opportunities.closeOn })
    .from(s.opportunities).innerJoin(s.accounts, eq(s.opportunities.accountId, s.accounts.id))
    .innerJoin(s.opportunityStages, eq(s.opportunities.opportunityStageId, s.opportunityStages.id))
    .where(and(eq(s.opportunities.isActive, true), eq(s.opportunityStages.identifier, "Prospecting"),
      kw ? or(ilike(s.opportunities.description, `%${kw}%`), ilike(s.accounts.company, `%${kw}%`), ilike(s.opportunities.name, `%${kw}%`)) : undefined))
    .orderBy(dir === "desc" ? desc(col) : asc(col), asc(s.opportunities.id)).limit(50);
  const page = Math.max(1, Number(p.page ?? 1) || 1);
  const rows = all.slice((page - 1) * PAGE, page * PAGE);
  const base = "/opportunities";
  const sp = { ...p, sort: p.sort ?? "company" };
  return (
    <>
      <div className="page-title"><h1>Open Opportunities</h1></div>
      <div className="card">
        <AutoSubmitForm className="toolbar">
          <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Search" style={{ minWidth: 280 }} />
          {p.sort && <input type="hidden" name="sort" value={p.sort} />}
        </AutoSubmitForm>
        {rows.length === 0 ? <div className="empty">There aren&apos;t any Opportunities to show.</div> : (
          <table className="table" data-testid="opportunities-table">
            <thead><tr>
              <SortHeader base={base} params={sp} field="opportunity" label="Opportunity" />
              <SortHeader base={base} params={sp} field="company" label="Company" />
              <SortHeader base={base} params={sp} field="amount" label="Amount" className="right" />
              <SortHeader base={base} params={sp} field="probability" label="Probability" className="right" />
              <SortHeader base={base} params={sp} field="close" label="Close Date" />
            </tr></thead>
            <tbody>{rows.map((o) => (
              <tr key={o.id}><td><Link href={`/opportunities/${o.id}`}>{o.name}</Link></td><td>{o.company}</td>
                <td className="right">{formatCurrency(o.amount)}</td><td className="right">{Number(o.probability ?? 0)}%</td><td>{formatDate(o.closeOn)}</td></tr>
            ))}</tbody>
          </table>
        )}
        <Pagination base={base} params={p} page={page} pageSize={PAGE} count={all.length} />
      </div>
    </>
  );
}
