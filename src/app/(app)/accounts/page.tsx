import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { ACCOUNTS_PAGE, listAccounts } from "@/lib/queries/accounts";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { Pagination, SortHeader } from "@/components/list";

type P = { q?: string; sort?: string; page?: string };

export default async function Accounts({ searchParams }: { searchParams: Promise<P> }) {
  await requireRole();
  const p = await searchParams;
  const { rows, count, page } = await listAccounts(p);
  const base = "/accounts";
  const sp = { ...p, sort: p.sort ?? "company" };
  return (
    <>
      <div className="page-title"><h1>Accounts</h1><Link className="btn" href="/accounts/new">New Account</Link></div>
      <div className="card">
        <AutoSubmitForm className="toolbar">
          <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Search" style={{ minWidth: 280 }} />
          {p.sort && <input type="hidden" name="sort" value={p.sort} />}
        </AutoSubmitForm>
        {rows.length === 0 ? <div className="empty">There aren&apos;t any Accounts to show.</div> : (
          <table className="table" data-testid="accounts-table">
            <thead><tr>
              <SortHeader base={base} params={sp} field="company" label="Company" />
              <SortHeader base={base} params={sp} field="code" label="Code" />
              <SortHeader base={base} params={sp} field="contact" label="Contact Name" />
              <SortHeader base={base} params={sp} field="country" label="Country/City" />
              <SortHeader base={base} params={sp} field="phone" label="Phone" />
            </tr></thead>
            <tbody>{rows.map((a) => (
              <tr key={a.id}><td><Link href={`/accounts/${a.id}`}>{a.company}</Link></td><td>{a.code}</td><td>{a.contact}</td>
                <td>{a.country}{a.city ? ` / ${a.city}` : ""}</td><td>{a.phone}</td></tr>
            ))}</tbody>
          </table>
        )}
        <Pagination base={base} params={p} page={page} pageSize={ACCOUNTS_PAGE} count={count} />
      </div>
    </>
  );
}
