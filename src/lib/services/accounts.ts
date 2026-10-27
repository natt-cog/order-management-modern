import "server-only";
import { and, desc, eq, ne } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { InvalidArgumentsException, nextCode, PermissionException } from "@/lib/rules";
import { isManager, isRepresentative, type Session } from "@/lib/auth";

export type AccountInput = {
  id?: number | null;
  company: string;
  code?: string;
  contact: string;
  countryId?: number | null;
  address?: string | null;
  city?: string | null;
  postalCode?: string | null;
  phone?: string | null;
  email?: string | null;
};

const trim = (v: string | null | undefined) => (v ?? "").trim();

/** Account_Validate（O11 のメッセージ文言をそのまま移植） */
export async function validateAccount(a: AccountInput) {
  if (a.company === "") throw new InvalidArgumentsException("Company name is required");
  if (a.code) {
    const dup = await db.select({ id: s.accounts.id }).from(s.accounts)
      .where(and(eq(s.accounts.code, a.code), ne(s.accounts.id, a.id ?? 0))).limit(1);
    if (dup.length) throw new InvalidArgumentsException("Company name must be unique");
  }
  if (a.contact === "") throw new InvalidArgumentsException("Code is required");
}

/** Account_GenerateCode */
export async function generateAccountCode() {
  const [last] = await db.select({ code: s.accounts.code }).from(s.accounts).orderBy(desc(s.accounts.code)).limit(1);
  return nextCode("A", last?.code ?? null);
}

/** Account_Save: Trim → 検証 → 新規は採番 */
export async function saveAccount(session: Session, input: AccountInput): Promise<number> {
  if (!isManager(session) && !isRepresentative(session)) throw new PermissionException();
  const a: AccountInput = {
    ...input,
    company: trim(input.company), code: trim(input.code), contact: trim(input.contact), address: trim(input.address),
    city: trim(input.city), postalCode: trim(input.postalCode), phone: trim(input.phone), email: trim(input.email),
  };
  await validateAccount(a);
  const values = {
    company: a.company, contact: a.contact, countryId: a.countryId ?? null, address: a.address || null, city: a.city || null,
    postalCode: a.postalCode || null, phone: a.phone || null, email: a.email || null,
  };
  if (!a.id) {
    const code = await generateAccountCode();
    const [r] = await db.insert(s.accounts).values({ ...values, code, createdBy: session.userId, createdOn: new Date(), isActive: true }).returning();
    return r.id;
  }
  await db.update(s.accounts).set({ ...values, code: a.code || undefined, updatedBy: session.userId, updatedOn: new Date() })
    .where(eq(s.accounts.id, a.id));
  return a.id;
}
