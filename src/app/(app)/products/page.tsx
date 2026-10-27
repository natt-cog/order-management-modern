import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { categories, listProducts, PRODUCT_SORTS } from "@/lib/queries/products";
import AutoSubmitForm from "@/components/AutoSubmitForm";
import { hrefWith } from "@/components/list";

type P = { q?: string; category?: string; sort?: string; max?: string };

/** Products（メニュー名 Catalog） */
export default async function Catalog({ searchParams }: { searchParams: Promise<P> }) {
  await requireRole();
  const p = await searchParams;
  const [cats, { rows, count, max }] = await Promise.all([categories(), listProducts(p)]);
  return (
    <>
      <div className="page-title"><h1>Catalog</h1><Link className="btn" href="/products/new">New Product</Link></div>
      <AutoSubmitForm className="toolbar">
        <input type="search" name="q" defaultValue={p.q ?? ""} placeholder="Search by product name" style={{ minWidth: 260 }} />
        <select name="category" defaultValue={p.category ?? ""} aria-label="Category">
          <option value="">All Categories</option>
          {cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select name="sort" defaultValue={p.sort ?? "name"} aria-label="Sort by">
          {PRODUCT_SORTS.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
      </AutoSubmitForm>
      {rows.length === 0 ? <div className="empty">There are no products to display.</div> : (
        <div className="products-grid" data-testid="products-grid">
          {rows.map((r) => (
            <Link key={r.id} href={`/products/${r.id}`} className="product-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/products/${r.id}/cover`} alt={r.name} loading="lazy" />
              <div><strong>{r.name}</strong></div>
              <div className="muted">REF {r.reference}</div>
              <div className="muted">{r.stock} in stock</div>
            </Link>
          ))}
        </div>
      )}
      <p className="muted" data-testid="catalog-count">{rows.length} of {count} products</p>
      {rows.length < count && (
        <p style={{ textAlign: "center" }}>
          <Link className="btn btn-secondary" href={hrefWith("/products", p, { max: String(max + max) })} scroll={false}>Load more</Link>
        </p>
      )}
    </>
  );
}
