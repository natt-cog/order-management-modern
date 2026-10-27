import Link from "next/link";
import { notFound } from "next/navigation";
import { requireRole } from "@/lib/auth";
import { getAccount } from "@/lib/queries/accounts";

export const dynamic = "force-dynamic";

/** AccountShow */
export default async function AccountShow({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ msg?: string }> }) {
  await requireRole();
  const { id } = await params;
  const { msg } = await searchParams;
  const a = await getAccount(Number(id));
  if (!a) notFound();
  const rows: [string, string | null][] = [
    ["Company Name", a.company], ["Code", a.code], ["Primary Contact", a.contact],
    ["Address", [a.address, a.postalCode, a.city].filter(Boolean).join(", ")], ["Country", a.country], ["Phone", a.phone], ["Email", a.email],
  ];
  return (
    <>
      <p><Link href="/accounts">‹ Back</Link></p>
      <div className="page-title"><h1>{a.company}</h1><Link className="btn btn-secondary" href={`/accounts/${a.id}/edit`}>Edit</Link></div>
      {msg && <div className="message success" role="status">Account &apos;{a.company}&apos; was successfully {msg === "created" ? "created" : "updated"}.</div>}
      <div className="card">
        <strong>Account details</strong>
        <dl className="dl" style={{ marginTop: 12 }}>{rows.map(([k, v]) => [<dt key={`${k}-t`}>{k}</dt>, <dd key={`${k}-d`}>{v}</dd>])}</dl>
      </div>
      <p><Link className="btn" href={`/orders/new?accountId=${a.id}`}>New Order</Link></p>
    </>
  );
}
