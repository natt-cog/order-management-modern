import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { listOrders } from "@/lib/order-queries";
import { OrdersTable } from "@/components/orders-table";

// AccountShow: account info + its orders and opportunities
export default async function AccountShow({ params }: { params: Promise<{ id: string }> }) {
  const id = Number((await params).id);
  const a = await db.query.accounts.findFirst({ where: eq(schema.accounts.id, id), with: { country: true, opportunities: { with: { stage: true } } } });
  if (!a) notFound();
  const orders = (await listOrders({ q: a.code })).filter((o) => o.accountCode === a.code);
  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between"><h1 className="text-2xl font-semibold">{a.company}</h1><Link href={`/accounts/${id}/edit`} className="rounded border px-3 py-1.5 text-sm">Edit</Link></div>
      <dl className="grid grid-cols-2 gap-3 rounded-lg bg-white p-4 text-sm shadow md:grid-cols-4">
        {[["Code", a.code], ["Contact", a.contact], ["Country", a.country?.name], ["City", a.city], ["Phone", a.phone], ["Email", a.email]].map(([k, v]) => <div key={k}><dt className="text-slate-500">{k}</dt><dd>{v || "-"}</dd></div>)}
      </dl>
      <h2 className="text-lg font-semibold">Orders</h2>
      <OrdersTable rows={orders} />
      <h2 className="text-lg font-semibold">Opportunities</h2>
      <ul className="rounded-lg bg-white p-4 text-sm shadow">{a.opportunities.map((o) => <li key={o.id}><Link href={`/opportunities/${o.id}`} className="text-sky-700 hover:underline">{o.name}</Link> — {o.stage.label}</li>)}</ul>
    </div>
  );
}
