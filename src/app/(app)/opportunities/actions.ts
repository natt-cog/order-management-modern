"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { and, eq, ne } from "drizzle-orm";
import { db, schema } from "@/db";
import { requireUser } from "@/lib/session";
import { validateOpportunity } from "@/lib/validation";

// Opportunity_Save (Opportunity_Validate)
export async function saveOpportunity(id: number, form: FormData) {
  const user = await requireUser();
  const v = { name: String(form.get("name") ?? "").trim(), typeId: Number(form.get("typeId")) || null, stageId: Number(form.get("stageId")) || null, amount: Number(form.get("amount")), probability: Number(form.get("probability")), expectedRevenue: Number(form.get("expectedRevenue")) };
  const nameTaken = (await db.$count(schema.opportunities, and(eq(schema.opportunities.name, v.name), ne(schema.opportunities.id, id)))) > 0;
  const issues = validateOpportunity({ ...v, nameTaken });
  if (issues.length) redirect(`/opportunities/${id}?error=${encodeURIComponent(issues.join("\n"))}`);
  await db.update(schema.opportunities).set({ name: v.name, opportunityTypeId: v.typeId!, opportunityStageId: v.stageId!, amount: v.amount, probability: v.probability, expectedRevenue: v.expectedRevenue, updatedBy: user.id, updatedOn: new Date() }).where(eq(schema.opportunities.id, id));
  revalidatePath("/opportunities");
  redirect(`/opportunities/${id}?saved=1`);
}
