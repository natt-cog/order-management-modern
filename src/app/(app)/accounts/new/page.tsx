import { requireRole } from "@/lib/auth";
import { countryOptions } from "@/lib/queries/accounts";
import { generateAccountCode } from "@/lib/services/accounts";
import AccountForm from "../AccountForm";

export const dynamic = "force-dynamic";

export default async function NewAccount() {
  await requireRole();
  const [code, countries] = await Promise.all([generateAccountCode(), countryOptions()]);
  return <AccountForm account={null} code={code} countries={countries} />;
}
