"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { InvalidArgumentsException, PermissionException } from "@/lib/rules";
import * as svc from "@/lib/services/orders";

export type ActionResult = { ok: boolean; message: string } | null;

function fail(e: unknown): ActionResult {
  if (e instanceof InvalidArgumentsException || e instanceof PermissionException) return { ok: false, message: e.message };
  console.error(e);
  return { ok: false, message: "An unexpected error occurred. Please try again later." };
}

const num = (v: FormDataEntryValue | null) => (v === null || v === "" ? null : Number(v));
const date = (v: FormDataEntryValue | null) => (v ? new Date(`${v}T00:00:00Z`) : null);

/** Order_Save（ヘッダー保存）: 新規時は保存後にその注文へ遷移 */
export async function saveOrderAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const s = await requireRole();
  const id = num(form.get("id"));
  let newId: number | null = null;
  try {
    const accountId = num(form.get("accountId"));
    if (!accountId) return { ok: false, message: "Account must be filled" };
    const saved = await svc.saveOrder(s, {
      id, accountId, opportunityId: num(form.get("opportunityId")), code: String(form.get("code") ?? ""),
      orderStatusId: num(form.get("orderStatusId")), expectedClosedOn: (form.get("expectedClosedOn") as string) || null,
      requiredOn: date(form.get("requiredOn")), shippedOn: date(form.get("shippedOn")),
    });
    if (!id) newId = saved;
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/orders");
  if (newId) redirect(`/orders/${newId}?saved=1`);
  return { ok: true, message: "The order was successfully saved." };
}

/** Order_SetStatus（Submit / Approve / Reject） */
export async function setStatusAction(orderId: number, statusId: number): Promise<ActionResult> {
  const s = await requireRole();
  try {
    await svc.setOrderStatus(s, orderId, statusId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: "The order status was changed." };
}

/** Order_Delete */
export async function deleteOrderAction(orderId: number): Promise<ActionResult> {
  const s = await requireRole();
  try {
    await svc.deleteOrder(s, orderId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath("/orders");
  redirect("/orders?deleted=1");
}

/** Product_Save（明細の追加・更新）= SaveOrderItemandUpdateStock */
export async function saveItemAction(_: ActionResult, form: FormData): Promise<ActionResult> {
  const s = await requireRole();
  const orderId = num(form.get("orderId"));
  try {
    await svc.saveOrderItem(s, {
      id: num(form.get("itemId")), orderId, productId: num(form.get("productId")),
      quantity: Number(form.get("quantity") ?? 0), discount: Number(form.get("discount") || 0),
    });
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: "" };
}

/** Product_Delete（明細の削除） */
export async function deleteItemAction(orderId: number, itemId: number): Promise<ActionResult> {
  const s = await requireRole();
  try {
    await svc.deleteOrderItem(s, itemId);
  } catch (e) {
    return fail(e);
  }
  revalidatePath(`/orders/${orderId}`);
  return { ok: true, message: "" };
}
