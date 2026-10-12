import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db, schema } from "@/db";
import { money, day } from "@/lib/format";
import { requireUser } from "@/lib/session";
import { isManager } from "@/lib/permissions";
import { STATUS } from "@/lib/order-service";
import { StatusBadge } from "@/components/orders-table";
import { addItem, removeItem, removeOrder, setStatus, updateOrder } from "../actions";

export default async function OrderDetail({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const [{ id: raw }, { error }, user] = await Promise.all([params, searchParams, requireUser()]);
  const id = Number(raw);
  const order = await db.query.orders.findFirst({ where: eq(schema.orders.id, id), with: { account: true, opportunity: true, status: true, creator: true, items: { where: eq(schema.orderItems.isActive, true), with: { product: true } } } });
  if (!order) notFound();
  const [accounts, opps, products] = await Promise.all([
    db.select().from(schema.accounts).orderBy(asc(schema.accounts.company)),
    db.select().from(schema.opportunities).where(eq(schema.opportunities.accountId, order.accountId)).orderBy(asc(schema.opportunities.name)),
    db.select().from(schema.products).where(eq(schema.products.isActive, true)).orderBy(asc(schema.products.name)),
  ]);
  const draft = order.orderStatusId === STATUS.Draft;
  const manager = isManager(user.role);
  const btn = "rounded px-3 py-1.5 text-sm font-medium";
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <h1 className="text-2xl font-semibold" data-testid="order-code">{order.code}</h1>
        <StatusBadge label={order.status.label} color={order.status.colorRgb} />
        <span className="text-sm text-slate-500">by {order.creator?.name ?? "-"}</span>
        <div className="ml-auto flex gap-2">
          {draft && <form action={setStatus.bind(null, id, STATUS.Submitted)}><button className={`${btn} bg-amber-500 text-white`}>Submit</button></form>}
          {manager && order.orderStatusId === STATUS.Submitted && <>
            <form action={setStatus.bind(null, id, STATUS.Closed)}><button className={`${btn} bg-emerald-600 text-white`}>Approve</button></form>
            <form action={setStatus.bind(null, id, STATUS.Rejected)}><button className={`${btn} bg-red-600 text-white`}>Reject</button></form>
          </>}
          {draft && <form action={removeOrder.bind(null, id)}><button className={`${btn} border border-red-600 text-red-600`}>Delete</button></form>}
        </div>
      </div>
      {error && <p role="alert" className="whitespace-pre-line rounded border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
      <form action={updateOrder.bind(null, id)} className="grid grid-cols-1 gap-3 rounded-lg bg-white p-4 shadow md:grid-cols-4">
        <label className="text-sm">Account
          <select name="accountId" defaultValue={order.accountId} disabled={!draft} className="mt-1 block w-full rounded border px-2 py-1">{accounts.map((a) => <option key={a.id} value={a.id}>{a.company}</option>)}</select>
        </label>
        <label className="text-sm">Opportunity
          <select name="opportunityId" defaultValue={order.opportunityId ?? ""} disabled={!draft} className="mt-1 block w-full rounded border px-2 py-1"><option value="">(none)</option>{opps.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}</select>
        </label>
        <label className="text-sm">Expected close<input type="date" name="expectedClosedOn" defaultValue={order.expectedClosedOn ?? ""} disabled={!draft} className="mt-1 block w-full rounded border px-2 py-1" /></label>
        <div className="flex items-end justify-between">
          <div><p className="text-xs text-slate-500">Total</p><p className="text-xl font-semibold" data-testid="order-total">{money(order.totalAmount)}</p></div>
          {draft && <button className={`${btn} bg-sky-700 text-white`}>Save</button>}
        </div>
      </form>
      <table className="w-full rounded-lg bg-white text-sm shadow" data-testid="items-table">
        <thead className="bg-slate-100 text-slate-600"><tr><th className="px-3 py-2 text-left">Product</th><th className="px-3 py-2 text-right">Price</th><th className="px-3 py-2 text-right">Qty</th><th className="px-3 py-2 text-right">Discount %</th><th className="px-3 py-2 text-right">Amount</th><th /></tr></thead>
        <tbody>
          {order.items.map((i) => (
            <tr key={i.id} className="border-t" data-testid="item-row">
              <td className="px-3 py-2 capitalize">{i.product.name}</td><td className="px-3 py-2 text-right">{money(i.product.price)}</td>
              <td className="px-3 py-2 text-right">{draft ? <input form={`item-${i.id}`} name="quantity" type="number" aria-label="Item quantity" defaultValue={i.quantity} className="w-20 rounded border px-2 py-1 text-right" /> : i.quantity}</td>
              <td className="px-3 py-2 text-right">{draft ? <input form={`item-${i.id}`} name="discount" type="number" aria-label="Item discount %" defaultValue={i.discount} className="w-20 rounded border px-2 py-1 text-right" /> : i.discount}</td>
              <td className="px-3 py-2 text-right">{money(i.amount)}</td>
              <td className="px-3 py-2 text-right">{draft && <div className="flex justify-end gap-3">
                <form id={`item-${i.id}`} action={addItem.bind(null, id)}><input type="hidden" name="itemId" value={i.id} /><input type="hidden" name="productId" value={i.productId} /><button className="text-sky-700 hover:underline">Update</button></form>
                <form action={removeItem.bind(null, id, i.id)}><button className="text-red-600 hover:underline">Remove</button></form>
              </div>}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {draft && (
        <form action={addItem.bind(null, id)} className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow" data-testid="add-item">
          <label className="text-sm">Product<select name="productId" className="mt-1 block w-72 rounded border px-2 py-1">{products.map((p) => <option key={p.id} value={p.id}>{p.name} ({p.stock > 0 ? `${p.stock} in stock` : "Out of stock"})</option>)}</select></label>
          <label className="text-sm">Quantity<input name="quantity" type="number" defaultValue={1} className="mt-1 block w-24 rounded border px-2 py-1" /></label>
          <label className="text-sm">Discount %<input name="discount" type="number" defaultValue={0} className="mt-1 block w-24 rounded border px-2 py-1" /></label>
          <button className={`${btn} bg-sky-700 text-white`}>Add product</button>
        </form>
      )}
      <p className="text-xs text-slate-500">Required on {day(order.requiredOn)} · Shipped on {day(order.shippedOn)} · Account {order.account.code}</p>
    </div>
  );
}
