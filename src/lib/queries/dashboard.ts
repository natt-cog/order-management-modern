import "server-only";
import { and, asc, desc, eq, gte, lte, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { OrderStatus } from "@/lib/services/orders";

/** SiteProperty_GetAll + クライアント変数 CompanyGoal(既定値 70) */
export async function getSiteProperties() {
  const rows = await db.select().from(s.siteProperties);
  const get = (k: string, d: string) => rows.find((r) => r.name === k)?.value ?? d;
  return {
    personalGoal: Number(get("Dashboard_PersonalGoal", "50000")),
    teamGoalPercent: Number(get("Dashboard_TeamGoalPercent", "54")),
    targetValue: Number(get("Dashboard_TargetValue", "10000")),
    companyGoalPercent: 70,
  };
}

/** Dashboard / DashboardManager の Goal 計算（OnInitialize のロジックを移植） */
export function goals(p: Awaited<ReturnType<typeof getSiteProperties>>, now = new Date()) {
  const m = now.getMonth() + 1;
  const team = p.targetValue * (p.teamGoalPercent / 100);
  const company = p.targetValue * (p.companyGoalPercent / 100);
  return {
    personal: { goal: p.personalGoal, current: p.personalGoal * ((m - 0.2) / 12) },
    teamRep: { goal: team, current: team * ((m - 0.1) / 12) },
    teamManager: { goal: team, current: team * ((m - 0.2) / 12) },
    company: { goal: company, current: company * ((m - 0.1) / 12) },
  };
}

const orderCols = {
  id: s.orders.id, code: s.orders.code, totalAmount: s.orders.totalAmount, company: s.accounts.company,
  status: s.orderStatuses.label, statusColor: s.orderStatuses.colorRgb,
};

/** Dashboard_OrdersBySalesRepresentative: 自分の Draft / Submitted / Rejected（各最大50件） */
export async function ordersByRepresentative(userId: number, statusId: number) {
  return db.select(orderCols).from(s.orders)
    .innerJoin(s.accounts, eq(s.orders.accountId, s.accounts.id))
    .innerJoin(s.orderStatuses, eq(s.orders.orderStatusId, s.orderStatuses.id))
    .where(and(eq(s.orders.isActive, true), eq(s.orders.createdBy, userId), eq(s.orders.orderStatusId, statusId)))
    .orderBy(asc(s.orders.updatedOn), asc(s.orders.id)).limit(50);
}

/** Dashboard_OrdersBySalesManager: 全員の Submitted（承認待ち） */
export async function submittedOrders() {
  return db.select(orderCols).from(s.orders)
    .innerJoin(s.accounts, eq(s.orders.accountId, s.accounts.id))
    .innerJoin(s.orderStatuses, eq(s.orders.orderStatusId, s.orderStatuses.id))
    .where(and(eq(s.orders.isActive, true), eq(s.orders.orderStatusId, OrderStatus.Submitted)))
    .orderBy(asc(s.orders.updatedOn), asc(s.orders.id)).limit(50);
}

/** Dashboard_OrdersBySalesManager: Prospecting の商談 */
export async function prospectingOpportunities() {
  return db.select({ id: s.opportunities.id, name: s.opportunities.name, amount: s.opportunities.amount, company: s.accounts.company })
    .from(s.opportunities).innerJoin(s.accounts, eq(s.opportunities.accountId, s.accounts.id))
    .innerJoin(s.opportunityStages, eq(s.opportunities.opportunityStageId, s.opportunityStages.id))
    .where(and(eq(s.opportunities.isActive, true), eq(s.opportunityStages.identifier, "Prospecting")))
    .orderBy(s.opportunities.name).limit(50);
}

/** Dashboard_TopPerformers: O11 の計算式 Price * Quantity * (100 - Discount / 100) をそのまま移植（既存不具合として文書化） */
export async function topPerformers() {
  const amount = sql<string>`sum(${s.products.price} * ${s.orderItems.quantity} * (100 - coalesce(${s.orderItems.discount}, 0) / 100))`;
  return db.select({ id: s.users.id, name: s.users.name, amount })
    .from(s.orderItems).innerJoin(s.orders, eq(s.orderItems.orderId, s.orders.id))
    .innerJoin(s.users, eq(s.orders.createdBy, s.users.id)).innerJoin(s.products, eq(s.orderItems.productId, s.products.id))
    .groupBy(s.users.id, s.users.name).orderBy(desc(amount)).limit(5);
}

/** Dashboard_TopProducts: 有効明細の数量合計の多い順に4件（カバー画像あり） */
export async function topProducts() {
  const qty = sql<number>`sum(${s.orderItems.quantity})::int`;
  return db.select({ id: s.products.id, name: s.products.name, reference: s.products.reference, stock: s.products.stock, qty })
    .from(s.products)
    .innerJoin(s.productPictures, and(eq(s.products.id, s.productPictures.productId), eq(s.productPictures.isCover, true)))
    .innerJoin(s.orderItems, eq(s.products.id, s.orderItems.productId))
    .where(eq(s.orderItems.isActive, true))
    .groupBy(s.products.id, s.products.name, s.products.reference, s.products.stock).orderBy(desc(qty)).limit(4);
}

/** Dashboard_GetHistory: 2020年に Closed になった注文の月別合計（O11 は期間を 2020 年に固定） */
export async function salesHistory() {
  const month = sql<number>`extract(month from ${s.orders.createdOn})::int`;
  return db.select({ month, amount: sql<string>`sum(${s.orders.totalAmount})` }).from(s.orders)
    .where(and(eq(s.orders.isActive, true), eq(s.orders.orderStatusId, OrderStatus.Closed),
      gte(s.orders.createdOn, new Date("2020-01-01T00:00:00Z")), lte(s.orders.createdOn, new Date("2020-12-31T23:59:59Z"))))
    .groupBy(month).orderBy(month);
}

/** Dashboard_GetByCategory: カテゴリ別明細金額の上位5件 */
/** Dashboard_GetByCategory: O11 の式と並び（AmountSum 昇順・先頭 5 件）をそのまま再現。タイトルは "Top 5" だが実際は下位 5 カテゴリ */
export async function amountByCategory() {
  const amount = sql<string>`sum(${s.products.price} * ${s.orderItems.quantity} * (100 - coalesce(${s.orderItems.discount}, 0) / 100))`;
  return db.select({ name: s.productCategories.name, amount }).from(s.orderItems)
    .innerJoin(s.products, eq(s.orderItems.productId, s.products.id))
    .innerJoin(s.productCategories, eq(s.products.categoryId, s.productCategories.id))
    .groupBy(s.productCategories.name).orderBy(asc(amount)).limit(5);
}
