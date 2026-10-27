import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { countryOptions, getAccount } from "@/lib/queries/accounts";
import AccountForm from "../../AccountForm";

export const dynamic = "force-dynamic";

export default async function AccountEdit({ params }: { params: Promise<{ id: string }> }) {
  await requireRole();
  const { id } = await params;
  const [a, countries] = await Promise.all([getAccount(Number(id)), countryOptions()]);
  if (!a) notFound();
  return <AccountForm account={a} code={a.code ?? ""} countries={countries} />;
}
