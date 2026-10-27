"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { InvalidArgumentsException, PermissionException } from "@/lib/rules";
import { saveAccount } from "@/lib/services/accounts";

export type AccountFormState = { ok: boolean; message: string } | null;

/** AccountEdit SaveOnClick → Account_CreateOrUpdate → AccountShow へ遷移 */
export async function saveAccountAction(_: AccountFormState, form: FormData): Promise<AccountFormState> {
  const session = await requireRole();
  const id = form.get("id") ? Number(form.get("id")) : null;
  const company = String(form.get("company") ?? "").trim();
  let savedId: number;
  try {
    savedId = await saveAccount(session, {
      id, company, code: String(form.get("code") ?? ""), contact: String(form.get("contact") ?? ""),
      countryId: form.get("countryId") ? Number(form.get("countryId")) : null, address: String(form.get("address") ?? ""),
      city: String(form.get("city") ?? ""), postalCode: String(form.get("postalCode") ?? ""),
      phone: String(form.get("phone") ?? ""), email: String(form.get("email") ?? ""),
    });
  } catch (e) {
    if (e instanceof InvalidArgumentsException || e instanceof PermissionException) return { ok: false, message: e.message };
    console.error(e);
    return { ok: false, message: "An unexpected error occurred. Please try again later." };
  }
  revalidatePath("/accounts");
  redirect(`/accounts/${savedId}?msg=${id ? "updated" : "created"}`);
}
