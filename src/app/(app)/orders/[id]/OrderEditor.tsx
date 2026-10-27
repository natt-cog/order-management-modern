"use client";
import Link from "next/link";
import { useActionState, useState, useTransition } from "react";
import { formatCurrency, formatO11Date, formatO11DateTime, toInputDate } from "@/lib/format";
import { deleteItemAction, deleteOrderAction, saveOrderAction, setStatusAction, type ActionResult } from "./actions";
import ItemPanel, { type ItemRow, type ProductOpt } from "./ItemPanel";

type Order = {
  id: number | null; code: string; accountId: number | null; opportunityId: number | null; orderStatusId: number; status: string;
  expectedClosedOn: string | null; requiredOn: string | null; shippedOn: string | null; totalAmount: string | null;
};
type Props = {
  order: Order; items: ItemRow[]; accounts: { id: number; company: string }[];
  opportunities: { id: number; name: string; accountId: number }[]; products: ProductOpt[]; isManager: boolean; justSaved: boolean;
};

const STEPS = [{ id: 1, label: "Draft" }, { id: 2, label: "Submitted" }, { id: 3, label: "Approved & Closed" }];

export default function OrderEditor({ order, items, accounts, opportunities, products, isManager, justSaved }: Props) {
  const isNew = order.id === null;
  const draftLike = order.orderStatusId === 1 || order.orderStatusId === 4;
  const editable = isNew || draftLike;
  const [editing, setEditing] = useState(isNew);
  const [saveState, saveAction, saving] = useActionState(saveOrderAction, justSaved ? { ok: true, message: "The order was successfully saved." } : null);
  const [msg, setMsg] = useState<ActionResult>(null);
  const [pending, start] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [panel, setPanel] = useState<ItemRow | "new" | null>(null);
  const [accountId, setAccountId] = useState(order.accountId ?? 0);
  const account = accounts.find((a) => a.id === order.accountId);
  const opp = opportunities.find((o) => o.id === order.opportunityId);
  const run = (fn: () => Promise<ActionResult>) => start(async () => setMsg(await fn()));
  const shown = msg ?? saveState;
  const stepIdx = order.orderStatusId === 4 ? 0 : STEPS.findIndex((s) => s.id === order.orderStatusId);

  return (
    <>
      <p><Link href="/orders">‹ Back</Link></p>
      <div className="page-title">
        <h1>Order {order.code} <span className="badge" style={{ background: "#90a4ae", fontSize: 13 }}>{order.status}</span></h1>
        {isManager && !isNew && order.orderStatusId === 1 && <button className="btn btn-danger" onClick={() => setConfirmDelete(true)}>Delete order</button>}
      </div>
      {shown?.message && <div className={`message ${shown.ok ? "success" : "error"}`} role="status">{shown.message}</div>}
      <div className="stepper">{STEPS.map((s, i) => <div key={s.id} className={`step ${i <= stepIdx ? "done" : ""}`}>{s.label}</div>)}</div>

      <form action={saveAction} className="card" onSubmit={() => setMsg(null)}>
        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <strong>Details</strong>
          {editable && (editing ? (
            <span style={{ display: "flex", gap: 8 }}>
              <button className="btn" disabled={saving}>Save</button>
              {!isNew && <button type="button" className="btn btn-secondary" onClick={() => setEditing(false)}>Cancel</button>}
            </span>
          ) : <button type="button" className="btn btn-secondary" onClick={() => setEditing(true)}>Edit</button>)}
        </div>
        <input type="hidden" name="id" value={order.id ?? ""} />
        <input type="hidden" name="code" value={order.code} />
        <input type="hidden" name="orderStatusId" value={order.orderStatusId} />
        <dl className="dl" style={{ marginTop: 12 }}>
          <dt>Code</dt><dd>{order.code}</dd>
          <dt>Account</dt><dd>{editing ? (
            <select name="accountId" value={accountId || ""} onChange={(e) => setAccountId(Number(e.target.value))} aria-label="Account">
              <option value="">- Select account -</option>
              {accounts.map((a) => <option key={a.id} value={a.id}>{a.company}</option>)}
            </select>) : <><input type="hidden" name="accountId" value={order.accountId ?? ""} />{account?.company}</>}</dd>
          {(editing || opp) && <><dt>Opportunity</dt><dd>{editing ? (
            <select name="opportunityId" defaultValue={order.opportunityId ?? ""} aria-label="Opportunity">
              <option value="">-</option>
              {opportunities.filter((o) => !accountId || o.accountId === accountId).map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>) : <><input type="hidden" name="opportunityId" value={order.opportunityId ?? ""} /><Link href={`/opportunities/${opp?.id}`}>{opp?.name}</Link></>}</dd></>}
          <dt>Order Date</dt><dd>{editing ? <input type="date" name="expectedClosedOn" defaultValue={order.expectedClosedOn ?? ""} aria-label="Order Date" />
            : <><input type="hidden" name="expectedClosedOn" value={order.expectedClosedOn ?? ""} />{formatO11Date(order.expectedClosedOn)}</>}</dd>
          <dt>Required On</dt><dd>{editing ? <input type="date" name="requiredOn" defaultValue={toInputDate(order.requiredOn)} aria-label="Required On" />
            : <><input type="hidden" name="requiredOn" value={toInputDate(order.requiredOn)} />{formatO11DateTime(order.requiredOn)}</>}</dd>
          {order.shippedOn && order.orderStatusId === 3 && <><dt>Shipped On</dt><dd>{formatO11DateTime(order.shippedOn)}</dd></>}
        </dl>
      </form>

      {!isNew && (
        <div className="card">
          <strong>Products</strong>
          <table className="table" data-testid="order-items">
            <thead><tr><th>Product</th><th className="right">Unit Price</th><th className="right">Units</th><th className="right">Discount</th><th className="right">Total</th>{draftLike && <th />}</tr></thead>
            <tbody>{items.map((i) => (
              <tr key={i.id}><td>{i.name}</td><td className="right">{formatCurrency(i.price)}</td><td className="right">{i.quantity}</td>
                <td className="right">{Number(i.discount ?? 0)} %</td><td className="right">{formatCurrency(i.amount)}</td>
                {draftLike && <td className="right">
                  <button className="btn-link" onClick={() => setPanel(i)}>Edit</button>{" "}
                  <button className="btn-link" disabled={pending} onClick={() => run(() => deleteItemAction(order.id!, i.id))}>Delete</button></td>}
              </tr>))}</tbody>
          </table>
          {draftLike && <p><button className="btn btn-secondary" onClick={() => setPanel("new")}>Add new product</button></p>}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span>Total amount <strong data-testid="order-total">{formatCurrency(order.totalAmount)}</strong></span>
            <span style={{ display: "flex", gap: 8, alignItems: "center" }}>
              {draftLike && items.length > 0 && <button className="btn" disabled={pending} onClick={() => run(() => setStatusAction(order.id!, 2))}>Submit</button>}
              {isManager && order.orderStatusId === 2 && <>
                <button className="btn btn-success" disabled={pending} onClick={() => run(() => setStatusAction(order.id!, 3))}>Approve</button>
                <span>or</span>
                <button className="btn btn-danger" disabled={pending} onClick={() => run(() => setStatusAction(order.id!, 4))}>Reject</button></>}
            </span>
          </div>
        </div>
      )}
      {panel && <ItemPanel orderId={order.id!} item={panel === "new" ? null : panel} products={products} onClose={() => setPanel(null)} />}
      {confirmDelete && (
        <div className="modal-backdrop"><div className="modal">
          <h3 style={{ marginTop: 0 }}>Delete this order?</h3><p>Once deleted, all changes will be lost.</p>
          <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
            <button className="btn btn-secondary" onClick={() => setConfirmDelete(false)}>Cancel</button>
            <button className="btn btn-danger" disabled={pending} onClick={() => run(() => deleteOrderAction(order.id!))}>Delete order</button>
          </div></div></div>
      )}
    </>
  );
}
