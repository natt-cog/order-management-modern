import "server-only";
import { and, desc, eq, sql } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { amountOf, InvalidArgumentsException, nextCode, PermissionException } from "@/lib/rules";
import { isManager, isRepresentative, type Session } from "@/lib/auth";

export const OrderStatus = { Draft: 1, Submitted: 2, Closed: 3, Rejected: 4 } as const;
type Tx = Parameters<Parameters<typeof db.transaction>[0]>[0];
type OrderInput = {
  id?: number | null;
  accountId: number | null;
  opportunityId?: number | null;
  code?: string;
  orderStatusId?: number | null;
  expectedClosedOn?: string | null;
  requiredOn?: Date | null;
  shippedOn?: Date | null;
  isActive?: boolean;
};

/** Order_GenerateCode */
export async function generateOrderCode(tx: Tx | typeof db = db): Promise<string> {
  const [last] = await tx.select({ code: s.orders.code }).from(s.orders).orderBy(desc(s.orders.code)).limit(1);
  return nextCode("ORD", last?.code ?? null);
}

/** Order_Validate */
export function validateOrder(o: { totalAmount?: number; orderStatusId?: number | null }) {
  if ((o.totalAmount ?? 0) < 0) throw new InvalidArgumentsException("Total amount must be greater or equal to zero");
  if (!o.orderStatusId) throw new InvalidArgumentsException("Status is required");
}

async function recalcTotal(tx: Tx, orderId: number) {
  const [r] = await tx.select({ sum: sql<string>`coalesce(sum(${s.orderItems.amount}), 0)` }).from(s.orderItems)
    .where(and(eq(s.orderItems.orderId, orderId), eq(s.orderItems.isActive, true)));
  return Number(r.sum);
}

/** Order_Save: ロール確認 → Trim → 検証 → 新規は採番+Draft / 既存のステータス変更は Manager のみ → 合計再計算 */
export async function saveOrder(session: Session, input: OrderInput, tx?: Tx): Promise<number> {
  const run = async (t: Tx) => {
    if (!isManager(session) && !isRepresentative(session)) throw new PermissionException();
    if (!input.accountId) throw new InvalidArgumentsException("Account must be filled");
    const isNew = !input.id;
    let status = input.orderStatusId ?? OrderStatus.Draft;
    let code = (input.code ?? "").trim();
    let total = 0;
    if (!isNew) {
      const [cur] = await t.select().from(s.orders).where(eq(s.orders.id, input.id!));
      if (!cur) throw new InvalidArgumentsException("Order not found");
      if (status !== cur.orderStatusId && !isManager(session)) {
        // Representative は Draft/Rejected → Submitted（Submit ボタン）のみ許可（OrderDetail 画面の Submit）
        const submitting = status === OrderStatus.Submitted && (cur.orderStatusId === OrderStatus.Draft || cur.orderStatusId === OrderStatus.Rejected);
        if (!submitting) throw new PermissionException();
      }
      code = code || cur.code;
      total = await recalcTotal(t, input.id!);
    }
    validateOrder({ totalAmount: total, orderStatusId: status });
    if (isNew) {
      code = await generateOrderCode(t);
      status = OrderStatus.Draft;
      const [o] = await t.insert(s.orders).values({
        code, accountId: input.accountId, opportunityId: input.opportunityId ?? null, orderStatusId: status, totalAmount: "0",
        expectedClosedOn: input.expectedClosedOn ?? null, requiredOn: input.requiredOn ?? null, shippedOn: input.shippedOn ?? null,
        createdBy: session.userId, createdOn: new Date(), isActive: true,
      }).returning();
      return o.id;
    }
    await t.update(s.orders).set({
      code, accountId: input.accountId, opportunityId: input.opportunityId ?? null, orderStatusId: status, totalAmount: String(total),
      expectedClosedOn: input.expectedClosedOn ?? null, requiredOn: input.requiredOn ?? null, shippedOn: input.shippedOn ?? null,
      isActive: input.isActive ?? true, updatedBy: session.userId, updatedOn: new Date(),
    }).where(eq(s.orders.id, input.id!));
    return input.id!;
  };
  return tx ? run(tx) : db.transaction(run);
}

/** Order_SetStatus（Submit / Approve / Reject） */
export async function setOrderStatus(session: Session, orderId: number, statusId: number) {
  return db.transaction(async (t) => {
    const [cur] = await t.select().from(s.orders).where(eq(s.orders.id, orderId));
    if (!cur) throw new InvalidArgumentsException("Order not found");
    if ((statusId === OrderStatus.Closed || statusId === OrderStatus.Rejected) && cur.orderStatusId !== OrderStatus.Submitted)
      throw new InvalidArgumentsException("Only submitted orders can be approved or rejected");
    if (statusId === OrderStatus.Submitted) {
      const [{ n }] = await t.select({ n: sql<number>`count(*)::int` }).from(s.orderItems)
        .where(and(eq(s.orderItems.orderId, orderId), eq(s.orderItems.isActive, true)));
      if (n === 0) throw new InvalidArgumentsException("Add at least one product before submitting");
    }
    return saveOrder(session, { ...cur, orderStatusId: statusId }, t);
  });
}

/** Order_Delete: 論理削除 + 在庫戻し（UpdateStockOnOrderDelete）。画面上は Manager かつ Draft のみ */
export async function deleteOrder(session: Session, orderId: number) {
  if (!isManager(session)) throw new PermissionException();
  return db.transaction(async (t) => {
    const [cur] = await t.select().from(s.orders).where(eq(s.orders.id, orderId));
    if (!cur) throw new InvalidArgumentsException("Order not found");
    const items = await t.select().from(s.orderItems).where(eq(s.orderItems.orderId, orderId));
    for (const i of items) await updateProductStock(t, i.productId, i.quantity, session);
    await saveOrder(session, { ...cur, isActive: false }, t);
  });
}

/** UpdateProductStock: Stock += quantity */
async function updateProductStock(t: Tx, productId: number, quantity: number, session: Session) {
  await t.update(s.products).set({ stock: sql`coalesce(${s.products.stock}, 0) + ${quantity}`, updatedBy: session.userId, updatedOn: new Date() })
    .where(and(eq(s.products.id, productId), eq(s.products.isActive, true)));
}

export type OrderItemInput = { id?: number | null; orderId: number | null; productId: number | null; quantity: number; discount: number };

/** OrderItem_Validate */
export async function validateOrderItem(t: Tx, i: OrderItemInput & { isActive?: boolean }) {
  if (!i.orderId) throw new InvalidArgumentsException("Order is required");
  if (!i.productId) throw new InvalidArgumentsException("Product is required");
  if (!(i.quantity > 0)) throw new InvalidArgumentsException("Quantity must be greater than zero");
  if (i.discount < 0) throw new InvalidArgumentsException("Discount must be greater or equal to zero");
  if (i.isActive === false) return;
  const [p] = await t.select().from(s.products).where(and(eq(s.products.id, i.productId), eq(s.products.isActive, true)));
  if (!p) throw new InvalidArgumentsException("Product is required");
  let available = p.stock ?? 0;
  if (i.id) {
    const [old] = await t.select().from(s.orderItems).where(eq(s.orderItems.id, i.id));
    if (old && old.productId === i.productId) available += old.quantity; // FinalStock = Stock + 現在の数量
  }
  if (available < i.quantity) throw new InvalidArgumentsException("Insufficient stock to fulfill your order");
}

/** SaveOrderItemandUpdateStock + OrderItem_Save + UpdateOrderAmount */
export async function saveOrderItem(session: Session, input: OrderItemInput) {
  return db.transaction(async (t) => {
    await validateOrderItem(t, input);
    const [p] = await t.select().from(s.products).where(eq(s.products.id, input.productId!));
    const amount = amountOf(Number(p.price), input.quantity, input.discount);
    let oldQty = 0;
    if (input.id) {
      const [old] = await t.select().from(s.orderItems).where(eq(s.orderItems.id, input.id));
      if (old?.productId !== input.productId && old) await updateProductStock(t, old.productId, old.quantity, session);
      else oldQty = old?.quantity ?? 0;
      await t.update(s.orderItems).set({ productId: input.productId!, quantity: input.quantity, discount: String(input.discount),
        amount: amount.toFixed(8), updatedBy: session.userId, updatedOn: new Date() }).where(eq(s.orderItems.id, input.id));
    } else {
      await t.insert(s.orderItems).values({ orderId: input.orderId!, productId: input.productId!, quantity: input.quantity,
        discount: String(input.discount), amount: amount.toFixed(8), createdBy: session.userId, createdOn: new Date(), isActive: true });
    }
    await updateProductStock(t, input.productId!, oldQty - input.quantity, session);
    const [o] = await t.select().from(s.orders).where(eq(s.orders.id, input.orderId!));
    await saveOrder(session, o, t);
  });
}

/** Product_Delete（明細の論理削除）+ 在庫戻し + 合計再計算 */
export async function deleteOrderItem(session: Session, itemId: number) {
  return db.transaction(async (t) => {
    const [i] = await t.select().from(s.orderItems).where(eq(s.orderItems.id, itemId));
    if (!i || !i.isActive) return;
    await t.update(s.orderItems).set({ isActive: false, updatedBy: session.userId, updatedOn: new Date() }).where(eq(s.orderItems.id, itemId));
    await updateProductStock(t, i.productId, i.quantity, session);
    const [o] = await t.select().from(s.orders).where(eq(s.orders.id, i.orderId));
    await saveOrder(session, o, t);
  });
}
