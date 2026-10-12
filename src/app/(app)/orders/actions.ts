"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { asc } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { ValidationError } from "@/lib/validation";
import { changeStatus, deleteOrder, deleteOrderItem, saveOrder, saveOrderItem } from "@/lib/order-service";

const n = (v: FormDataEntryValue | null) => (v === null || v === "" ? 0 : Number(v));
const back = (id: number, error?: string) => redirect(`/orders/${id}` + (error ? `?error=${encodeURIComponent(error)}` : ""));

async function run(id: number, fn: () => Promise<unknown>) {
  try {
    await fn();
  } catch (e) {
    if (e instanceof ValidationError) back(id, e.message);
    throw e;
  }
  revalidatePath(`/orders/${id}`);
  back(id);
}

// New Order: OrderDetail with OrderId = NullIdentifier() creates a Draft for the first account
export async function createOrder() {
  const user = await requireUser();
  const [first] = await db.select({ id: schema.accounts.id }).from(schema.accounts).orderBy(asc(schema.accounts.company)).limit(1);
  const id = await saveOrder(user, { accountId: first.id });
  redirect(`/orders/${id}?edit=1`);
}

export async function updateOrder(id: number, form: FormData) {
  const user = await requireUser();
  await run(id, () => saveOrder(user, { id, accountId: n(form.get("accountId")), opportunityId: n(form.get("opportunityId")) || null, expectedClosedOn: (form.get("expectedClosedOn") as string) || null }));
}

export async function addItem(id: number, form: FormData) {
  const user = await requireUser();
  await run(id, () => saveOrderItem(user, { id: n(form.get("itemId")) || undefined, orderId: id, productId: n(form.get("productId")), quantity: n(form.get("quantity")), discount: n(form.get("discount")) }));
}

export async function removeItem(id: number, itemId: number) {
  const user = await requireUser();
  await run(id, () => deleteOrderItem(user, itemId));
}

export async function setStatus(id: number, to: number) {
  const user = await requireUser();
  await run(id, () => changeStatus(user, id, to));
}

export async function removeOrder(id: number) {
  const user = await requireUser();
  await deleteOrder(user, id);
  revalidatePath("/orders");
  redirect("/orders");
}
