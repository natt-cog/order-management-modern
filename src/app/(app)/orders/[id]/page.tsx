import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { isManager, requireRole } from "@/lib/auth";
import { generateOrderCode } from "@/lib/services/orders";
import OrderEditor from "./OrderEditor";

export const dynamic = "force-dynamic";

/** OrderDetail（id="new" は新規注文: AccountId / OpportunityId をクエリで受け取る） */
export default async function OrderDetail({ params, searchParams }: {
  params: Promise<{ id: string }>; searchParams: Promise<{ accountId?: string; opportunityId?: string; saved?: string }>;
}) {
  const session = await requireRole();
  const { id } = await params;
  const sp = await searchParams;
  const isNew = id === "new";
  const [accounts, opportunities, products] = await Promise.all([
    db.select({ id: s.accounts.id, company: s.accounts.company }).from(s.accounts).where(eq(s.accounts.isActive, true)).orderBy(asc(s.accounts.company)),
    db.select({ id: s.opportunities.id, name: s.opportunities.name, accountId: s.opportunities.accountId }).from(s.opportunities)
      .where(eq(s.opportunities.isActive, true)).orderBy(asc(s.opportunities.name)),
    db.select({ id: s.products.id, name: s.products.name, price: s.products.price, stock: s.products.stock }).from(s.products)
      .where(eq(s.products.isActive, true)).orderBy(asc(s.products.name)),
  ]);
  let order;
  let items: { id: number; productId: number; name: string; price: string; quantity: number; discount: string | null; amount: string | null }[] = [];
  if (isNew) {
    const req = new Date();
    req.setUTCMonth(req.getUTCMonth() + 1);
    order = {
      id: null, code: await generateOrderCode(), accountId: sp.accountId ? Number(sp.accountId) : null,
      opportunityId: sp.opportunityId ? Number(sp.opportunityId) : null, orderStatusId: 1, status: "Draft",
      expectedClosedOn: new Date().toISOString().slice(0, 10), requiredOn: req.toISOString(), shippedOn: null as string | null, totalAmount: "0",
    };
  } else {
    const [o] = await db.select({
      id: s.orders.id, code: s.orders.code, accountId: s.orders.accountId, opportunityId: s.orders.opportunityId,
      orderStatusId: s.orders.orderStatusId, status: s.orderStatuses.label, expectedClosedOn: s.orders.expectedClosedOn,
      requiredOn: s.orders.requiredOn, shippedOn: s.orders.shippedOn, totalAmount: s.orders.totalAmount,
    }).from(s.orders).innerJoin(s.orderStatuses, eq(s.orders.orderStatusId, s.orderStatuses.id))
      .where(and(eq(s.orders.id, Number(id)), eq(s.orders.isActive, true)));
    if (!o) notFound();
    order = { ...o, requiredOn: o.requiredOn?.toISOString() ?? null, shippedOn: o.shippedOn?.toISOString() ?? null };
    items = await db.select({
      id: s.orderItems.id, productId: s.orderItems.productId, name: s.products.name, price: s.products.price,
      quantity: s.orderItems.quantity, discount: s.orderItems.discount, amount: s.orderItems.amount,
    }).from(s.orderItems).innerJoin(s.products, eq(s.orderItems.productId, s.products.id))
      .where(and(eq(s.orderItems.orderId, Number(id)), eq(s.orderItems.isActive, true))).orderBy(asc(s.orderItems.id));
  }
  return (
    <OrderEditor order={order} items={items} accounts={accounts} opportunities={opportunities}
      products={products.map((p) => ({ ...p, price: Number(p.price), stock: p.stock ?? 0 }))}
      isManager={isManager(session)} justSaved={sp.saved === "1"} />
  );
}
