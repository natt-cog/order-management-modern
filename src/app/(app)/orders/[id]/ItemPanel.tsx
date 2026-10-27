"use client";
import { useActionState, useEffect, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { saveItemAction } from "./actions";

export type ItemRow = { id: number; productId: number; name: string; price: string; quantity: number; discount: string | null; amount: string | null };
export type ProductOpt = { id: number; name: string; price: number; stock: number };

/** "Editing Product" サイドパネル（OrderItem_OnChange / Product_GetAmountAndStock / 在庫チェック） */
export default function ItemPanel({ orderId, item, products, onClose }: { orderId: number; item: ItemRow | null; products: ProductOpt[]; onClose: () => void }) {
  const [productId, setProductId] = useState(item?.productId ?? 0);
  const [quantity, setQuantity] = useState(item?.quantity ?? 0);
  const [discount, setDiscount] = useState(Number(item?.discount ?? 0));
  const [state, action, pending] = useActionState(saveItemAction, null);
  const p = products.find((x) => x.id === productId);
  const inventory = item && item.productId === productId ? item.quantity : 0;
  const available = (p?.stock ?? 0) + inventory;
  const qtyError = !p ? null : available === 0 ? "Out of stock" : quantity - inventory > (p.stock ?? 0) ? `Only ${available} in stock` : null;
  const price = p?.price ?? 0;
  const total = price * quantity - price * quantity * (discount / 100);

  useEffect(() => { if (state?.ok) onClose(); }, [state, onClose]);

  return (
    <div className="modal-backdrop">
      <form className="modal" action={action}>
        <h3 style={{ marginTop: 0 }}>Editing Product</h3>
        {state && !state.ok && <div className="message error">{state.message}</div>}
        <input type="hidden" name="orderId" value={orderId} />
        <input type="hidden" name="itemId" value={item?.id ?? ""} />
        <div className="field"><label htmlFor="productId">Product</label>
          <select id="productId" name="productId" value={productId || ""} onChange={(e) => setProductId(Number(e.target.value))}>
            <option value="">- Product -</option>
            {products.map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}
          </select></div>
        <div className="field"><label>Unit Price</label><span data-testid="item-unit-price">{formatCurrency(price)}</span></div>
        <div className="field"><label htmlFor="quantity">Units</label>
          <input id="quantity" name="quantity" type="number" min={0} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} />
          {qtyError && <span className="error">{qtyError}</span>}</div>
        <div className="field"><label htmlFor="discount">Discount</label>
          <input id="discount" name="discount" type="number" min={0} max={99} value={discount} onChange={(e) => setDiscount(Number(e.target.value))} /></div>
        <div className="field"><label>Total</label><strong data-testid="item-total">{formatCurrency(total)}</strong></div>
        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button className="btn" disabled={pending || !!qtyError}>{item ? "Save" : "Add"}</button>
          <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
        </div>
      </form>
    </div>
  );
}
