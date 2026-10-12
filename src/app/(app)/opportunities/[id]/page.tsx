import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveOpportunity } from "../actions";

export default async function OpportunityDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ id: raw }, sp] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  const o = await db.query.opportunities.findFirst({ where: eq(schema.opportunities.id, id), with: { account: true } });
  if (!o) notFound();
  const [types, stages] = await Promise.all([db.select().from(schema.opportunityTypes).orderBy(asc(schema.opportunityTypes.order)), db.select().from(schema.opportunityStages).orderBy(asc(schema.opportunityStages.order))]);
  const f = "mt-1 block w-full rounded border px-2 py-1";
  return (
    <form action={saveOpportunity.bind(null, id)} className="grid max-w-3xl grid-cols-2 gap-3 rounded-lg bg-white p-4 shadow">
      <h1 className="col-span-2 text-2xl font-semibold">{o.name} <span className="text-base font-normal text-slate-500">· {o.account.company}</span></h1>
      {sp.error && <p role="alert" className="col-span-2 whitespace-pre-line rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.error}</p>}
      {sp.saved && <p className="col-span-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Opportunity saved</p>}
      <label className="col-span-2 text-sm">Name<input name="name" defaultValue={o.name} className={f} /></label>
      <label className="text-sm">Type<select name="typeId" defaultValue={o.opportunityTypeId} className={f}>{types.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</select></label>
      <label className="text-sm">Stage<select name="stageId" defaultValue={o.opportunityStageId} className={f}>{stages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      <label className="text-sm">Amount €<input name="amount" type="number" step="0.01" defaultValue={o.amount ?? 0} className={f} /></label>
      <label className="text-sm">Probability %<input name="probability" type="number" defaultValue={o.probability ?? 0} className={f} /></label>
      <label className="text-sm">Expected revenue €<input name="expectedRevenue" type="number" step="0.01" defaultValue={o.expectedRevenue ?? 0} className={f} /></label>
      <div className="col-span-2 text-right"><button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">Save</button></div>
    </form>
  );
}
