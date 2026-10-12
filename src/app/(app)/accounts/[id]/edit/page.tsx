import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveAccount } from "../../actions";

export default async function AccountEdit({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id: raw }, { error }] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  const a = id ? await db.query.accounts.findFirst({ where: eq(schema.accounts.id, id) }) : undefined;
  const countries = await db.select().from(schema.countries).orderBy(asc(schema.countries.name));
  const f = "mt-1 block w-full rounded border px-2 py-1";
  return (
    <form action={saveAccount.bind(null, id)} className="grid max-w-3xl grid-cols-2 gap-3 rounded-lg bg-white p-4 shadow">
      <h1 className="col-span-2 text-2xl font-semibold">{a ? `Edit ${a.company}` : "New Account"}</h1>
      {error && <p role="alert" className="col-span-2 whitespace-pre-line rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <label className="text-sm">Company<input name="company" defaultValue={a?.company} className={f} /></label>
      <label className="text-sm">Contact<input name="contact" defaultValue={a?.contact} className={f} /></label>
      <input type="hidden" name="code" value={a?.code ?? ""} />
      <label className="text-sm">Country<select name="countryId" defaultValue={a?.countryId ?? ""} className={f}><option value="">(none)</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
      <label className="text-sm">City<input name="city" defaultValue={a?.city ?? ""} className={f} /></label>
      <label className="text-sm">Phone<input name="phone" defaultValue={a?.phone ?? ""} className={f} /></label>
      <label className="text-sm">Email<input name="email" defaultValue={a?.email ?? ""} className={f} /></label>
      <div className="col-span-2 text-right"><button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">Save</button></div>
    </form>
  );
}
