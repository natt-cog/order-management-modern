import { and, asc, desc, eq, gte, ilike, inArray, lte, or, sql, type SQL } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, accounts, orderStatuses, users } = schema;
export type OrderFilter = { q?: string; status?: number; min?: number; max?: number; employee?: number; sort?: string; dir?: string; statuses?: number[] };

// Orders screen GetOrders aggregate: keyword on Account.Code / Account.Company / Order.Code, status, amount range, employee
export async function listOrders(f: OrderFilter) {
  const where: (SQL | undefined)[] = [eq(orders.isActive, true)];
  if (f.q) where.push(or(ilike(accounts.code, `%${f.q}%`), ilike(accounts.company, `%${f.q}%`), ilike(orders.code, `%${f.q}%`)));
  if (f.status) where.push(eq(orders.orderStatusId, f.status));
  if (f.statuses) where.push(inArray(orders.orderStatusId, f.statuses));
  if (f.min !== undefined) where.push(gte(orders.totalAmount, f.min));
  if (f.max !== undefined) where.push(lte(orders.totalAmount, f.max));
  if (f.employee) where.push(eq(orders.createdBy, f.employee));
  const cols = { code: orders.code, company: accounts.company, total: orders.totalAmount, status: orders.orderStatusId, expected: orders.expectedClosedOn, employee: users.name } as const;
  const col = cols[(f.sort as keyof typeof cols) ?? "code"] ?? orders.code;
  return db
    .select({ id: orders.id, code: orders.code, company: accounts.company, accountCode: accounts.code, total: orders.totalAmount, statusId: orders.orderStatusId, status: orderStatuses.label, color: orderStatuses.colorRgb, expected: orders.expectedClosedOn, employee: users.name })
    .from(orders)
    .innerJoin(accounts, eq(orders.accountId, accounts.id))
    .innerJoin(orderStatuses, eq(orders.orderStatusId, orderStatuses.id))
    .leftJoin(users, eq(orders.createdBy, users.id))
    .where(and(...where))
    .orderBy(f.dir === "desc" ? desc(col) : asc(col));
}

// GetEmployees (SQL): users that created at least one order
export const listEmployees = () =>
  db.selectDistinct({ id: users.id, name: users.name }).from(users).innerJoin(orders, eq(orders.createdBy, users.id)).orderBy(users.name);

export const amountRange = async () => {
  const [r] = await db.select({ max: sql<string>`coalesce(max(${orders.totalAmount}),0)` }).from(orders);
  return Math.ceil(Number(r.max));
};
