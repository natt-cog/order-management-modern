"use client";
import Link from "next/link";
import { useActionState } from "react";
import { saveAccountAction } from "./actions";

type A = { id: number; company: string; code: string | null; contact: string | null; countryId: number | null; address: string | null;
  city: string | null; postalCode: string | null; phone: string | null; email: string | null };

export default function AccountForm({ account, code, countries }: { account: A | null; code: string; countries: { id: number; name: string }[] }) {
  const [state, action, pending] = useActionState(saveAccountAction, null);
  const back = account ? `/accounts/${account.id}` : "/accounts";
  const field = (name: keyof A, label: string, extra: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div className="field"><label htmlFor={name}>{label}</label>
      <input id={name} name={name} defaultValue={(account?.[name] as string | null) ?? ""} {...extra} /></div>
  );
  return (
    <form action={action}>
      <p><Link href={back}>‹ Back</Link></p>
      <div className="page-title"><h1>{account ? account.company : "New Account"}</h1></div>
      {state && !state.ok && <div className="message error" role="alert">{state.message}</div>}
      <input type="hidden" name="id" value={account?.id ?? ""} />
      <div className="card">
        <strong>Account details</strong>
        <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
          {field("company", "Company Name")}
          <div className="field"><label htmlFor="code">Code</label><input id="code" name="code" defaultValue={account?.code ?? code} readOnly /></div>
          {field("address", "Address")}
          {field("postalCode", "Postal Code")}
          {field("city", "City")}
          <div className="field"><label htmlFor="countryId">Country</label>
            <select id="countryId" name="countryId" defaultValue={account?.countryId ?? ""}>
              <option value="">- Select country -</option>{countries.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select></div>
          {field("contact", "Primary Contact")}
          {field("phone", "Phone")}
          {field("email", "Email", { type: "email" })}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
          <button className="btn" disabled={pending}>Save</button>
          <Link className="btn btn-secondary" href={back}>Cancel</Link>
        </div>
      </div>
    </form>
  );
}
