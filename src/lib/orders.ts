import { desc } from "drizzle-orm";
import { db, schema } from "@/db";

// OrderItem amount: (Price * Quantity) - (Price * Quantity * Discount / 100)  (OrderItem_Save)
export const lineAmount = (price: number, quantity: number, discount: number) =>
  Math.round((price * quantity - (price * quantity * discount) / 100) * 100) / 100;

// Order_GenerateCode: last code's number + 1, formatted ORD0001..ORD9999
export function nextOrderCode(lastCode?: string | null) {
  if (!lastCode) return "ORD0001";
  const n = parseInt(lastCode.substring(3), 10) + 1;
  return "ORD" + String(n).padStart(4, "0");
}

export async function generateCode() {
  const [last] = await db.select({ code: schema.orders.code }).from(schema.orders).orderBy(desc(schema.orders.code)).limit(1);
  return nextOrderCode(last?.code);
}
