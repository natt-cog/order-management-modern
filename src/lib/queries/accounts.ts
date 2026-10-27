import "server-only";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";

export const ACCOUNTS_PAGE = 20;
const SORTS = { company: s.accounts.company, code: s.accounts.code, contact: s.accounts.contact, country: s.countries.name, phone: s.accounts.phone } as const;

/** Accounts 画面: Code / Company / Contact / City / Country の部分一致、既定ソート Company */
export async function listAccounts(p: { q?: string; sort?: string; page?: string }) {
  const kw = (p.q ?? "").trim();
  const where = and(eq(s.accounts.isActive, true), kw ? or(
    ilike(s.accounts.code, `%${kw}%`), ilike(s.accounts.company, `%${kw}%`), ilike(s.accounts.contact, `%${kw}%`),
    ilike(s.accounts.city, `%${kw}%`), ilike(s.countries.name, `%${kw}%`)) : undefined);
  const [key, dir] = (p.sort ?? "company").split(".");
  const col = SORTS[key as keyof typeof SORTS] ?? s.accounts.company;
  const page = Math.max(1, Number(p.page ?? 1) || 1);
  const [rows, [{ count }]] = await Promise.all([
    db.select({ id: s.accounts.id, company: s.accounts.company, code: s.accounts.code, contact: s.accounts.contact,
      country: s.countries.name, city: s.accounts.city, phone: s.accounts.phone })
      .from(s.accounts).leftJoin(s.countries, eq(s.accounts.countryId, s.countries.id)).where(where)
      .orderBy(dir === "desc" ? desc(col) : asc(col), asc(s.accounts.id)).limit(ACCOUNTS_PAGE).offset((page - 1) * ACCOUNTS_PAGE),
    db.select({ count: sql<number>`count(*)::int` }).from(s.accounts).leftJoin(s.countries, eq(s.accounts.countryId, s.countries.id)).where(where),
  ]);
  return { rows, count, page };
}

export async function getAccount(id: number) {
  const [a] = await db.select({ a: s.accounts, country: s.countries.name }).from(s.accounts)
    .leftJoin(s.countries, eq(s.accounts.countryId, s.countries.id)).where(eq(s.accounts.id, id));
  return a ? { ...a.a, country: a.country } : null;
}

export async function countryOptions() {
  return db.select({ id: s.countries.id, name: s.countries.name }).from(s.countries).orderBy(asc(s.countries.name)).limit(500);
}
