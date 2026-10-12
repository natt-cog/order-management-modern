import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { saveProduct } from "../actions";

export default async function ProductDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  const [{ id: raw }, sp] = await Promise.all([params, searchParams]);
  const id = Number(raw);
  const p = await db.query.products.findFirst({ where: eq(schema.products.id, id), with: { features: true, model: { with: { brand: true } } } });
  if (!p) notFound();
  const [cats, models] = await Promise.all([db.select().from(schema.productCategories).orderBy(asc(schema.productCategories.name)), db.select().from(schema.models).orderBy(asc(schema.models.name))]);
  const f = "mt-1 block w-full rounded border px-2 py-1";
  return (
    <div className="grid gap-6 md:grid-cols-[320px_1fr]">
      <div className="rounded-lg bg-white p-4 shadow">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={`/api/pictures/${p.id}`} alt={p.name} className="mx-auto h-64 object-contain" />
        <p className="mt-3 text-sm text-slate-500">{p.model?.brand.name} · {p.model?.name}</p>
        <ul className="mt-3 list-disc pl-5 text-sm">{p.features.map((x) => <li key={x.id}>{x.description}</li>)}</ul>
      </div>
      <form action={saveProduct.bind(null, id)} className="grid grid-cols-2 gap-3 rounded-lg bg-white p-4 shadow">
        <h1 className="col-span-2 text-2xl font-semibold capitalize">{p.name}</h1>
        {sp.error && <p role="alert" className="col-span-2 whitespace-pre-line rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{sp.error}</p>}
        {sp.saved && <p className="col-span-2 rounded bg-emerald-50 px-3 py-2 text-sm text-emerald-700">Product saved</p>}
        <label className="col-span-2 text-sm">Name<input name="name" defaultValue={p.name} className={f} /></label>
        <label className="text-sm">Category<select name="categoryId" defaultValue={p.categoryId} className={f}>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm">Model<select name="modelId" defaultValue={p.modelId ?? ""} className={f}><option value="">(none)</option>{models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select></label>
        <label className="text-sm">Price €<input name="price" type="number" step="0.01" defaultValue={p.price} className={f} /></label>
        <label className="text-sm">Stock<input name="stock" type="number" defaultValue={p.stock} className={f} /></label>
        <label className="text-sm">Reorder level<input name="reorderLevel" type="number" defaultValue={p.reorderLevel ?? ""} className={f} /></label>
        <label className="text-sm">Reference<input disabled defaultValue={p.reference ?? ""} className={f} /></label>
        <label className="col-span-2 text-sm">Description<textarea name="description" defaultValue={p.description ?? ""} rows={3} className={f} /></label>
        <div className="col-span-2 text-right"><button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white">Save</button></div>
      </form>
    </div>
  );
}
