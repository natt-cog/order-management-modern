import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "@/db";
import { generateCode, lineAmount } from "@/lib/orders";
import { assertCanUseOrders, isManager, type Role } from "@/lib/permissions";
import { ValidationError, validateOrder, validateOrderItem } from "@/lib/validation";

export const STATUS = { Draft: 1, Submitted: 2, Closed: 3, Rejected: 4 } as const;
type Actor = { id: number; role: Role };
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];

// Order_Save + UpdateOrderAmount: total = SUM(price * qty * (100 - discount) / 100) of active items
async function recomputeTotal(tx: Tx, orderId: number) {
  const [r] = await tx
    .select({ total: sql<string>`coalesce(sum(${schema.orderItems.amount}), 0)` })
    .from(schema.orderItems)
    .where(and(eq(schema.orderItems.orderId, orderId), eq(schema.orderItems.isActive, true)));
  const total = Number(r.total);
  await tx.update(schema.orders).set({ totalAmount: total, updatedOn: new Date() }).where(eq(schema.orders.id, orderId));
  return total;
}

export async function saveOrder(actor: Actor, input: { id?: number; accountId: number; opportunityId?: number | null; expectedClosedOn?: string | null; requiredOn?: Date | null }) {
  assertCanUseOrders(actor.role);
  const issues = validateOrder({ accountId: input.accountId, totalAmount: 0, orderStatusId: STATUS.Draft });
  if (issues.length) throw new ValidationError(issues);
  return db.transaction(async (tx) => {
    if (!input.id) {
      const [o] = await tx.insert(schema.orders).values({
        code: await generateCode(), accountId: input.accountId, opportunityId: input.opportunityId ?? null,
        orderStatusId: STATUS.Draft, expectedClosedOn: input.expectedClosedOn ?? null, requiredOn: input.requiredOn ?? null, createdBy: actor.id,
      }).returning();
      return o.id;
    }
    await tx.update(schema.orders).set({
      accountId: input.accountId, opportunityId: input.opportunityId ?? null, expectedClosedOn: input.expectedClosedOn ?? null,
      requiredOn: input.requiredOn ?? null, updatedBy: actor.id, updatedOn: new Date(),
    }).where(eq(schema.orders.id, input.id));
    return input.id;
  });
}

// Status transitions: rep -> Submit (Draft only); manager -> Approve&Close / Reject (Submitted only)
export async function changeStatus(actor: Actor, orderId: number, to: number) {
  assertCanUseOrders(actor.role);
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, orderId) });
  if (!order) throw new ValidationError(["Order not found"]);
  const ok =
    (to === STATUS.Submitted && order.orderStatusId === STATUS.Draft) ||
    (isManager(actor.role) && order.orderStatusId === STATUS.Submitted && (to === STATUS.Closed || to === STATUS.Rejected)) ||
    (isManager(actor.role) && to === STATUS.Draft && order.orderStatusId === STATUS.Rejected);
  if (!ok) throw new ValidationError(["Invalid status change"]);
  await db.update(schema.orders).set({ orderStatusId: to, updatedBy: actor.id, updatedOn: new Date(), shippedOn: to === STATUS.Closed ? new Date() : order.shippedOn }).where(eq(schema.orders.id, orderId));
}

// OrderItem_Save + SaveOrderItemandUpdateStock: stock -= (newQty - previousQty)
export async function saveOrderItem(actor: Actor, input: { id?: number; orderId: number; productId: number; quantity: number; discount: number }) {
  assertCanUseOrders(actor.role);
  return db.transaction(async (tx) => {
    const order = await tx.query.orders.findFirst({ where: eq(schema.orders.id, input.orderId) });
    if (order && order.orderStatusId !== STATUS.Draft) throw new ValidationError(["Only draft orders can be edited"]);
    const prev = input.id ? await tx.query.orderItems.findFirst({ where: eq(schema.orderItems.id, input.id) }) : undefined;
    const product = await tx.query.products.findFirst({ where: eq(schema.products.id, input.productId) });
    const reserved = prev && prev.productId === input.productId ? prev.quantity : 0;
    const available = (product?.stock ?? 0) + reserved;
    const issues = validateOrderItem({ ...input, orderId: order?.id }, available);
    if (issues.length) throw new ValidationError(issues);
    const amount = lineAmount(product!.price, input.quantity, input.discount);
    if (prev) {
      if (prev.productId !== input.productId) await tx.update(schema.products).set({ stock: sql`${schema.products.stock} + ${prev.quantity}` }).where(eq(schema.products.id, prev.productId));
      await tx.update(schema.orderItems).set({ productId: input.productId, quantity: input.quantity, discount: input.discount, amount, updatedBy: actor.id, updatedOn: new Date() }).where(eq(schema.orderItems.id, prev.id));
    } else {
      await tx.insert(schema.orderItems).values({ orderId: input.orderId, productId: input.productId, quantity: input.quantity, discount: input.discount, amount, createdBy: actor.id });
    }
    await tx.update(schema.products).set({ stock: sql`${schema.products.stock} - ${input.quantity - reserved}` }).where(eq(schema.products.id, input.productId));
    return recomputeTotal(tx, input.orderId);
  });
}

export async function deleteOrderItem(actor: Actor, itemId: number) {
  assertCanUseOrders(actor.role);
  return db.transaction(async (tx) => {
    const item = await tx.query.orderItems.findFirst({ where: eq(schema.orderItems.id, itemId) });
    if (!item) return;
    await tx.update(schema.products).set({ stock: sql`${schema.products.stock} + ${item.quantity}` }).where(eq(schema.products.id, item.productId));
    await tx.delete(schema.orderItems).where(eq(schema.orderItems.id, itemId));
    await recomputeTotal(tx, item.orderId);
  });
}

// UpdateStockOnOrderDelete + DeleteOrder
export async function deleteOrder(actor: Actor, orderId: number) {
  assertCanUseOrders(actor.role);
  await db.transaction(async (tx) => {
    const items = await tx.select().from(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    for (const i of items) await tx.update(schema.products).set({ stock: sql`${schema.products.stock} + ${i.quantity}` }).where(eq(schema.products.id, i.productId));
    await tx.delete(schema.orderItems).where(eq(schema.orderItems.orderId, orderId));
    await tx.delete(schema.orders).where(eq(schema.orders.id, orderId));
  });
}
