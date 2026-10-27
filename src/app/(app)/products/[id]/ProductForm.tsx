"use client";
import Link from "next/link";
import { useActionState, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { saveProductAction } from "./actions";

type Opt = { id: number; name: string };
export type ProductView = {
  id: number; name: string; description: string; categoryId: number; modelId: number | null; price: number; discount: number;
  stock: number; reference: string; ean: string; weight: string; dimensions: string; isActive: boolean;
};
type Props = {
  product: ProductView | null; features: string[]; pictures: { id: number; isCover: boolean | null }[];
  categories: Opt[]; brands: Opt[]; models: (Opt & { brandId: number })[]; justSaved: boolean;
};

function Field({ name, label, err, children }: { name: string; label: string; err: Record<string, string>; children: React.ReactNode }) {
  return <div className="field"><label htmlFor={name}>{label}</label>{children}{err[name] && <span className="error">{err[name]}</span>}</div>;
}

export default function ProductForm({ product, features, pictures, categories, brands, models, justSaved }: Props) {
  const isNew = product === null;
  const [editing, setEditing] = useState(isNew);
  const [state, action, pending] = useActionState(saveProductAction, justSaved ? { ok: true, message: "Product updated successfully." } : null);
  const [price, setPrice] = useState(product?.price ?? 0);
  const [discount, setDiscount] = useState(Math.round((product?.discount ?? 0) * 10000) / 100);
  const initialBrand = models.find((m) => m.id === product?.modelId)?.brandId ?? 0;
  const [brandId, setBrandId] = useState(initialBrand);
  const [deleted, setDeleted] = useState<number[]>([]);
  const err = state?.errors ?? {};
  const ro = !editing;
  const finalPrice = Math.round(price * (1 - discount / 100) * 100) / 100;
  const feats = [...features, "", "", "", ""].slice(0, 4);
  const cat = categories.find((c) => c.id === product?.categoryId)?.name;
  const brand = brands.find((b) => b.id === initialBrand)?.name;
  const model = models.find((m) => m.id === product?.modelId)?.name;

  return (
    <form action={action}>
      <p><Link href="/products">‹ Back</Link></p>
      <div className="page-title">
        <h1>{isNew ? "New product" : "Product details"}</h1>
        {editing ? <button key="save" type="submit" className="btn" disabled={pending}>Save</button>
          : <button key="edit" type="button" className="btn btn-secondary" onClick={(e) => { e.preventDefault(); setEditing(true); }}>Edit</button>}
      </div>
      {state?.message && <div className={`message ${state.ok ? "success" : "error"}`} role="status">{state.message}</div>}
      <input type="hidden" name="id" value={product?.id ?? ""} />
      <input type="hidden" name="existingPictureCount" value={pictures.length} />
      {deleted.map((d) => <input key={d} type="hidden" name="deletePictureIds" value={d} />)}
      <div className="grid" style={{ gridTemplateColumns: "2fr 1fr" }}>
        <div className="card">
          <strong>General info</strong>
          <label style={{ display: "block", margin: "8px 0" }}>
            <input type="checkbox" name="isActive" defaultChecked={product?.isActive ?? true} disabled={ro} /> Product is active
            {ro && product?.isActive && <input type="hidden" name="isActive" value="on" />}</label>
          <Field err={err} name="name" label="Product title *"><input id="name" name="name" defaultValue={product?.name} readOnly={ro} /></Field>
          <Field err={err} name="categoryId" label="Category *">{ro ? <span>{cat}</span> : (
            <select id="categoryId" name="categoryId" defaultValue={product?.categoryId ?? ""}>
              <option value="">- Select category -</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>)}</Field>
          <Field err={err} name="description" label="Description *"><textarea id="description" name="description" rows={4} defaultValue={product?.description} readOnly={ro} /></Field>
          <div className="grid" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
            <Field err={err} name="price" label="Price *"><input id="price" name="price" type="number" step="0.01" value={price} readOnly={ro} onChange={(e) => setPrice(Number(e.target.value))} /></Field>
            <Field err={err} name="discount" label="Discount (%)"><input id="discount" name="discount" type="number" step="0.01" value={discount} readOnly={ro} onChange={(e) => setDiscount(Number(e.target.value))} /></Field>
            <div className="field"><label>Final price</label><strong data-testid="final-price">{formatCurrency(finalPrice)}</strong></div>
            <Field err={err} name="stock" label="Stock *"><input id="stock" name="stock" type="number" defaultValue={product?.stock ?? 0} readOnly={ro} /></Field>
          </div>
        </div>
        <div className="card">
          <strong>Images</strong>
          <div className="thumbs">{pictures.filter((p) => !deleted.includes(p.id)).map((p) => (
            <div key={p.id} className="thumb">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`/api/pictures/${p.id}`} alt="" />{p.isCover && <span className="badge">Cover</span>}
              {editing && <button type="button" className="btn-link" onClick={() => setDeleted([...deleted, p.id])}>Delete</button>}
            </div>))}</div>
          {editing && <input type="file" name="pictures" accept="image/*" multiple aria-label="Upload images" />}
          {err.pictures && <span className="error">{err.pictures}</span>}
        </div>
      </div>
      <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
        <div className="card">
          <strong>Specifications</strong>
          <Field err={err} name="reference" label="Reference *"><input id="reference" name="reference" defaultValue={product?.reference} readOnly={ro} /></Field>
          <Field err={err} name="ean" label="EAN"><input id="ean" name="ean" defaultValue={product?.ean} readOnly={ro} /></Field>
          <div className="field"><label htmlFor="brand">Brand</label>{ro ? <span>{brand}</span> : (
            <select id="brand" value={brandId || ""} onChange={(e) => setBrandId(Number(e.target.value))}>
              <option value="">-</option>{brands.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}</select>)}</div>
          <div className="field"><label htmlFor="modelId">Model</label>{ro ? <><span>{model}</span><input type="hidden" name="modelId" value={product?.modelId ?? ""} /></> : (
            <select id="modelId" name="modelId" defaultValue={product?.modelId ?? ""}>
              <option value="">-</option>{models.filter((m) => !brandId || m.brandId === brandId).map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>)}</div>
          <Field err={err} name="weight" label="Weight"><input id="weight" name="weight" defaultValue={product?.weight} readOnly={ro} /></Field>
          <Field err={err} name="dimensions" label="Dimensions"><input id="dimensions" name="dimensions" defaultValue={product?.dimensions} readOnly={ro} /></Field>
        </div>
        <div className="card">
          <strong>Features</strong>
          {ro ? <ul>{features.map((f, i) => <li key={i}>{f}</li>)}</ul>
            : feats.map((f, i) => <input key={i} name="features" defaultValue={f} placeholder="Add a feature here" style={{ display: "block", width: "100%", marginTop: 6 }} />)}
          {ro && features.map((f, i) => <input key={i} type="hidden" name="features" value={f} />)}
        </div>
      </div>
      {ro && <>
        <input type="hidden" name="categoryId" value={product?.categoryId ?? ""} />
      </>}
    </form>
  );
}
