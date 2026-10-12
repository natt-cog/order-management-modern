import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { money, day } from "@/lib/format";

// Opportunities screen: Prospecting stage only (O11 aggregate filter)
export default async function OpportunitiesPage() {
  const rows = await db.query.opportunities.findMany({ where: eq(schema.opportunities.opportunityStageId, 1), with: { account: true }, orderBy: asc(schema.opportunities.closeOn) });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Opportunities</h1>
      <table className="w-full rounded-lg bg-white text-sm shadow" data-testid="opps-table">
        <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Name</th><th className="px-3 py-2 text-left">Company</th><th className="px-3 py-2 text-right">Amount</th><th className="px-3 py-2 text-right">Probability</th><th className="px-3 py-2 text-left">Close on</th></tr></thead>
        <tbody>{rows.map((o) => <tr key={o.id} className="border-t"><td className="px-3 py-2"><Link href={`/opportunities/${o.id}`} className="text-sky-700 hover:underline">{o.name}</Link></td><td className="px-3 py-2">{o.account.company}</td><td className="px-3 py-2 text-right">{money(o.amount)}</td><td className="px-3 py-2 text-right">{o.probability}%</td><td className="px-3 py-2">{day(o.closeOn)}</td></tr>)}</tbody>
      </table>
    </div>
  );
}
