import Link from "next/link";
import { and, asc, desc, eq, ilike } from "drizzle-orm";
import { db, schema } from "@/db";
import { money } from "@/lib/format";

const { products, productCategories } = schema;
const SORTS = { name: asc(products.name), stock: desc(products.stock), created: desc(products.createdOn) } as const; // ProductSort static entity

// Products (Catalog): GetProductsByProductName with keyword / category / SortBy, "Load more" doubles MaxRecords
export default async function ProductsPage({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
  const sp = await searchParams;
  const max = Number(sp.max ?? 12);
  const where = and(eq(products.isActive, true), sp.q ? ilike(products.name, `%${sp.q}%`) : undefined, sp.category ? eq(products.categoryId, Number(sp.category)) : undefined);
  const [cats, rows, all] = await Promise.all([
    db.select().from(productCategories).orderBy(asc(productCategories.name)),
    db.select().from(products).where(where).orderBy(SORTS[(sp.sort as keyof typeof SORTS) ?? "name"] ?? SORTS.name).limit(max),
    db.$count(products, where),
  ]);
  const more = "/products?" + new URLSearchParams({ ...(sp as Record<string, string>), max: String(max * 2) });
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Catalog</h1>
      <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
        <label className="text-sm">Search<input name="q" defaultValue={sp.q} placeholder="Product name" className="mt-1 block w-64 rounded border px-2 py-1" /></label>
        <label className="text-sm">Category<select name="category" defaultValue={sp.category ?? ""} className="mt-1 block rounded border px-2 py-1"><option value="">All</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label className="text-sm">Sort by<select name="sort" defaultValue={sp.sort ?? "name"} className="mt-1 block rounded border px-2 py-1"><option value="name">Name</option><option value="stock">Stock</option><option value="created">Created on</option></select></label>
        <button className="rounded border px-3 py-1 text-sm">Filter</button>
      </form>
      <p className="text-sm text-slate-500" data-testid="product-count">Showing {rows.length} of {all} products</p>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {rows.map((p) => (
          <Link key={p.id} href={`/products/${p.id}`} className="rounded-lg bg-white p-3 shadow hover:shadow-md" data-testid="product-card">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/pictures/${p.id}`} alt={p.name} className="mx-auto h-36 object-contain" />
            <p className="mt-2 font-medium capitalize">{p.name}</p>
            <p className="text-xs text-slate-500">Ref. {p.reference}</p>
            <div className="mt-1 flex justify-between text-sm"><span>{money(p.price)}</span><span className={p.stock > 0 ? "text-emerald-700" : "text-red-600"}>{p.stock > 0 ? `${p.stock} in stock` : "Out of stock"}</span></div>
          </Link>
        ))}
      </div>
      {rows.length < all && <Link href={more} className="block rounded border bg-white py-2 text-center text-sm">Load more</Link>}
    </div>
  );
}
