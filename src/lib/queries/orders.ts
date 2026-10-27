import "server-only";
import { and, asc, desc, eq, gte, ilike, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema as s } from "@/db";

export type OrderListParams = {
  q?: string; emp?: string; status?: string; min?: string; max?: string; sort?: string; page?: string;
};
export const PAGE_SIZE = 20;

const SORTS: Record<string, SQL | unknown> = {
  number: s.orders.code, company: s.accounts.company, amount: s.orders.totalAmount, date: s.orders.expectedClosedOn,
  required: s.orders.requiredOn, createdby: s.users.name, state: s.orderStatuses.label,
};

/** GetCeilingandFloor: Floor / Ceiling（100 単位） */
export async function amountRange() {
  const [r] = await db.select({ min: sql<string>`min(${s.orders.totalAmount})`, max: sql<string>`max(${s.orders.totalAmount})` })
    .from(s.orders).where(eq(s.orders.isActive, true));
  const min = Math.trunc(Number(r?.min ?? 0) / 100) * 100;
  const max = Math.trunc(Number(r?.max ?? 0) / 100) * 100 + 100;
  return { min, max };
}

export async function employees() {
  return db.selectDistinct({ id: s.users.id, name: s.users.name }).from(s.users)
    .innerJoin(s.orders, eq(s.orders.createdBy, s.users.id)).orderBy(s.users.name);
}

/** Orders 画面の GetOrdersByEmployeeId */
export async function listOrders(p: OrderListParams, opts: { closedOnly?: boolean } = {}) {
  const kw = (p.q ?? "").trim();
  const where: (SQL | undefined)[] = [eq(s.orders.isActive, true)];
  if (kw) where.push(or(ilike(s.accounts.code, `%${kw}%`), ilike(s.accounts.company, `%${kw}%`), ilike(s.orders.code, `%${kw}%`)));
  if (p.emp) where.push(eq(s.orders.createdBy, Number(p.emp)));
  if (opts.closedOnly) where.push(eq(s.orders.orderStatusId, 3));
  else if (p.status) where.push(eq(s.orders.orderStatusId, Number(p.status)));
  if (p.min) where.push(gte(s.orders.totalAmount, p.min));
  if (p.max) where.push(lte(s.orders.totalAmount, p.max));
  const [key, dir] = (p.sort ?? "").split(".");
  const col = SORTS[key] as Parameters<typeof asc>[0] | undefined;
  // TableSort 未指定時は O11 実機と同じ並び（作成者 Id → 注文 Id）
  const orderBy = col ? [dir === "desc" ? desc(col) : asc(col), asc(s.orders.id)] : [asc(s.orders.createdBy), asc(s.orders.id)];
  const page = Math.max(1, Number(p.page ?? 1) || 1);
  const base = db.select({
    id: s.orders.id, code: s.orders.code, company: s.accounts.company, totalAmount: s.orders.totalAmount,
    orderDate: s.orders.expectedClosedOn, requiredOn: s.orders.requiredOn, createdBy: s.users.name,
    status: s.orderStatuses.label, statusColor: s.orderStatuses.colorRgb,
  }).from(s.orders)
    .innerJoin(s.accounts, eq(s.orders.accountId, s.accounts.id))
    .innerJoin(s.users, eq(s.orders.createdBy, s.users.id))
    .innerJoin(s.orderStatuses, eq(s.orders.orderStatusId, s.orderStatuses.id))
    .where(and(...where));
  const [rows, [{ count }]] = await Promise.all([
    base.orderBy(...orderBy).limit(PAGE_SIZE).offset((page - 1) * PAGE_SIZE),
    db.select({ count: sql<number>`count(*)::int` }).from(s.orders)
      .innerJoin(s.accounts, eq(s.orders.accountId, s.accounts.id)).where(and(...where)),
  ]);
  return { rows, count, page };
}
