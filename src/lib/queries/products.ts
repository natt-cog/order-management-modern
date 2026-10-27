import "server-only";
import { and, asc, eq, ilike, ne, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

/** ProductSort 静的エンティティ（Value は O11 の動的ソート式） */
export const PRODUCT_SORTS = [
  { id: "name", label: "Name", order: [asc(s.products.name)] },
  { id: "stock", label: "Stock", order: [asc(s.products.stock), asc(s.products.id)] },
  { id: "created", label: "Created on", order: [asc(s.products.createdOn), asc(s.products.id)] },
] as const;

export const CATALOG_PAGE = 12;

export async function categories() {
  return db.select({ id: s.productCategories.id, name: s.productCategories.name }).from(s.productCategories)
    .where(ne(s.productCategories.name, "")).orderBy(asc(s.productCategories.name)).limit(500);
}

/** Products(Catalog) 画面の GetProductsByProductName: 名前部分一致 + カテゴリ + ソート、Load more で件数倍増 */
export async function listProducts(p: { q?: string; category?: string; sort?: string; max?: string }) {
  const kw = (p.q ?? "").trim();
  const where = and(
    kw ? ilike(s.products.name, `%${kw}%`) : undefined,
    p.category ? eq(s.products.categoryId, Number(p.category)) : undefined,
  );
  const sort = PRODUCT_SORTS.find((x) => x.id === p.sort) ?? PRODUCT_SORTS[0];
  const max = Math.max(CATALOG_PAGE, Number(p.max ?? CATALOG_PAGE) || CATALOG_PAGE);
  const [rows, [{ count }]] = await Promise.all([
    db.select({ id: s.products.id, name: s.products.name, reference: s.products.reference, stock: s.products.stock,
      price: s.products.price, discount: s.products.discount, isActive: s.products.isActive })
      .from(s.products).where(where).orderBy(...sort.order).limit(max),
    db.select({ count: sql<number>`count(*)::int` }).from(s.products).where(where),
  ]);
  return { rows, count, max };
}
