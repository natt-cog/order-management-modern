import Link from "next/link";
import { asc, desc, ilike, or } from "drizzle-orm";
import { db, schema } from "@/db";

const { accounts } = schema;
export default async function AccountsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const cols = { code: accounts.code, company: accounts.company, contact: accounts.contact } as const;
  const col = cols[(sp.sort as keyof typeof cols) ?? "company"] ?? accounts.company;
  const rows = await db.query.accounts.findMany({ where: sp.q ? or(ilike(accounts.company, `%${sp.q}%`), ilike(accounts.code, `%${sp.q}%`), ilike(accounts.contact, `%${sp.q}%`)) : undefined, with: { country: true }, orderBy: sp.dir === "desc" ? desc(col) : asc(col) });
  const sortHref = (c: string) => `/accounts?${new URLSearchParams({ ...(sp as Record<string, string>), sort: c, dir: sp.sort === c && sp.dir !== "desc" ? "desc" : "asc" })}`;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">Accounts</h1><Link href="/accounts/0/edit" className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">New Account</Link></div>
      <form className="rounded-lg bg-white p-4 shadow"><input name="q" defaultValue={sp.q} placeholder="Search accounts" className="w-72 rounded border px-2 py-1" /></form>
      <table className="w-full rounded-lg bg-white text-sm shadow" data-testid="accounts-table">
        <thead className="bg-slate-100 text-slate-600"><tr>{[["code", "Code"], ["company", "Company"], ["contact", "Contact"]].map(([c, l]) => <th key={c} className="px-3 py-2 text-left"><Link href={sortHref(c)}>{l}</Link></th>)}<th className="px-3 py-2 text-left">Country</th><th className="px-3 py-2 text-left">Phone</th></tr></thead>
        <tbody>{rows.map((a) => <tr key={a.id} className="border-t hover:bg-slate-50"><td className="px-3 py-2">{a.code}</td><td className="px-3 py-2"><Link href={`/accounts/${a.id}`} className="text-sky-700 hover:underline">{a.company}</Link></td><td className="px-3 py-2">{a.contact}</td><td className="px-3 py-2">{a.country?.name ?? "-"}</td><td className="px-3 py-2">{a.phone ?? "-"}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
