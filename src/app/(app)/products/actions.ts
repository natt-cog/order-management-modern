"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { validateProduct } from "@/lib/validation";

// Product_Save (Product_Validate)
export async function saveProduct(id: number, form: FormData) {
  const user = await requireUser();
  const v = { name: String(form.get("name") ?? ""), categoryId: Number(form.get("categoryId")) || null, price: Number(form.get("price")), stock: Number(form.get("stock")) };
  const issues = validateProduct(v);
  if (issues.length) redirect(`/products/${id}?error=${encodeURIComponent(issues.join("\n"))}`);
  await db.update(schema.products).set({
    name: v.name.trim(), categoryId: v.categoryId!, price: v.price, stock: v.stock, description: String(form.get("description") ?? "") || null,
    modelId: Number(form.get("modelId")) || null, reorderLevel: form.get("reorderLevel") ? Number(form.get("reorderLevel")) : null, updatedBy: user.id, updatedOn: new Date(),
  }).where(eq(schema.products.id, id));
  revalidatePath(`/products/${id}`);
  redirect(`/products/${id}?saved=1`);
}
