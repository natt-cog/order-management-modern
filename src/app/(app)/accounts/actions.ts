"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { validateAccount } from "@/lib/validation";

// Account_Save (Account_Validate); new accounts get the next "A000n" code
export async function saveAccount(id: number, form: FormData) {
  const user = await requireUser();
  const company = String(form.get("company") ?? ""), contact = String(form.get("contact") ?? "");
  let code = String(form.get("code") ?? "").trim();
  if (!id) {
    const [last] = await db.select({ code: schema.accounts.code }).from(schema.accounts).orderBy(desc(schema.accounts.code)).limit(1);
    code = "A" + String((last ? parseInt(last.code.slice(1), 10) : 0) + 1).padStart(4, "0");
  }
  const dup = await db.$count(schema.accounts, and(eq(schema.accounts.code, code), ne(schema.accounts.id, id)));
  const issues = validateAccount({ company, contact, codeTaken: dup > 0 });
  if (issues.length) redirect(`/accounts/${id}/edit?error=${encodeURIComponent(issues.join("\n"))}`);
  const values = { company: company.trim(), contact: contact.trim(), countryId: Number(form.get("countryId")) || null, city: String(form.get("city") ?? "") || null, phone: String(form.get("phone") ?? "") || null, email: String(form.get("email") ?? "") || null };
  if (id) await db.update(schema.accounts).set({ ...values, updatedBy: user.id, updatedOn: new Date() }).where(eq(schema.accounts.id, id));
  else [{ id }] = await db.insert(schema.accounts).values({ ...values, code, createdBy: user.id }).returning({ id: schema.accounts.id });
  revalidatePath("/accounts");
  redirect(`/accounts/${id}`);
}
