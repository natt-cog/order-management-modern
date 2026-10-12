import Link from "next/link";
import { OrdersTable } from "@/components/orders-table";
import { amountRange, listEmployees, listOrders } from "@/lib/order-queries";
import { createOrder } from "./actions";

const TABS = [{ id: 0, label: "All" }, { id: 1, label: "Draft" }, { id: 2, label: "Submitted" }, { id: 3, label: "Approved & Closed" }];
type SP = Promise<Record<string, string | undefined>>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const status = Number(sp.status ?? 0);
  const [rows, employees, maxAmount] = await Promise.all([
    listOrders({ q: sp.q, status: status || undefined, min: sp.min ? Number(sp.min) : undefined, max: sp.max ? Number(sp.max) : undefined, employee: sp.employee ? Number(sp.employee) : undefined, sort: sp.sort, dir: sp.dir }),
    listEmployees(),
    amountRange(),
  ]);
  const href = (patch: Record<string, string | number>) => "/orders?" + new URLSearchParams({ ...(sp as Record<string, string>), ...Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, String(v)])) }).toString();
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Orders</h1>
        <form action={createOrder}><button className="rounded bg-sky-700 px-4 py-2 text-sm font-medium text-white hover:bg-sky-800">New Order</button></form>
      </div>
      <form className="flex flex-wrap items-end gap-3 rounded-lg bg-white p-4 shadow">
        <input type="hidden" name="status" value={status} />
        <label className="text-sm">Search<input name="q" defaultValue={sp.q} placeholder="Order number or company" className="mt-1 block w-64 rounded border px-2 py-1" /></label>
        <label className="text-sm">Employee
          <select name="employee" defaultValue={sp.employee ?? ""} className="mt-1 block rounded border px-2 py-1">
            <option value="">All</option>{employees.map((e) => <option key={e.id} value={e.id}>{e.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Min €<input name="min" type="number" min={0} max={maxAmount} defaultValue={sp.min ?? 0} className="mt-1 block w-28 rounded border px-2 py-1" /></label>
        <label className="text-sm">Max €<input name="max" type="number" min={0} max={maxAmount} defaultValue={sp.max ?? maxAmount} className="mt-1 block w-28 rounded border px-2 py-1" /></label>
        <button className="rounded border px-3 py-1 text-sm">Filter</button>
      </form>
      <div className="flex gap-2 border-b">
        {TABS.map((t) => <Link key={t.id} href={href({ status: t.id })} className={`px-4 py-2 text-sm ${t.id === status ? "border-b-2 border-sky-700 font-semibold text-sky-700" : "text-slate-600"}`}>{t.label}</Link>)}
      </div>
      <p className="text-sm text-slate-500">{rows.length} orders</p>
      <OrdersTable rows={rows} sortHref={(c) => href({ sort: c, dir: sp.sort === c && sp.dir !== "desc" ? "desc" : "asc" })} />
    </div>
  );
}
