import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";

const { orders, orderItems, products, productCategories, users } = schema;
// SiteProperty_GetDashboard
export const SITE = { personalGoal: 50000, targetValue: 10000, teamGoalPercent: 54 };

// Dashboard_GetHistory: SUM(TotalAmount) by month(ExpectedClosedOn) for a status
export const salesByMonth = (statusId: number, userId?: number) =>
  db.select({ month: sql<number>`extract(month from ${orders.expectedClosedOn})::int`, total: sql<number>`sum(${orders.totalAmount})::float` })
    .from(orders).where(and(eq(orders.isActive, true), eq(orders.orderStatusId, statusId), userId ? eq(orders.createdBy, userId) : undefined))
    .groupBy(sql`1`).orderBy(sql`1`);

// Dashboard_GetByCategory
export const salesByCategory = (userId?: number) =>
  db.select({ name: productCategories.name, total: sql<number>`sum(${orderItems.amount})::float` })
    .from(orderItems).innerJoin(products, eq(orderItems.productId, products.id)).innerJoin(productCategories, eq(products.categoryId, productCategories.id)).innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(userId ? eq(orders.createdBy, userId) : undefined).groupBy(productCategories.name).orderBy(desc(sql`2`));

export const topPerformers = () =>
  db.select({ name: users.name, total: sql<number>`sum(${orders.totalAmount})::float` }).from(orders).innerJoin(users, eq(orders.createdBy, users.id))
    .where(eq(orders.orderStatusId, 3)).groupBy(users.name).orderBy(desc(sql`2`));

export const topProducts = () =>
  db.select({ id: products.id, name: products.name, qty: sql<number>`sum(${orderItems.quantity})::int` }).from(orderItems).innerJoin(products, eq(orderItems.productId, products.id))
    .groupBy(products.id, products.name).orderBy(desc(sql`3`)).limit(5);
