"use client";
import { useActionState, useState } from "react";
import { doLogin, loginSampleUser } from "./actions";

type Sample = { id: number; name: string; role: string };

export default function LoginForm({ samples }: { samples: Sample[] }) {
  const [error, action, pending] = useActionState(doLogin, null);
  const [open, setOpen] = useState(false);
  return (
    <>
      <form action={action}>
        {error && <div className="message error">{error}</div>}
        <div className="field"><label htmlFor="username">Username</label>
          <input id="username" name="username" placeholder="Type your username" autoComplete="username" /></div>
        <div className="field"><label htmlFor="password">Password</label>
          <input id="password" name="password" type="password" placeholder="Type your password" autoComplete="current-password" /></div>
        <div className="field" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          <input id="remember" name="remember" type="checkbox" defaultChecked /><label htmlFor="remember">Remember me</label></div>
        <button className="btn" style={{ width: "100%" }} disabled={pending}>{pending ? "Logging in..." : "Login"}</button>
      </form>
      <p style={{ textAlign: "center" }}>
        <button type="button" className="btn-link" onClick={() => setOpen(true)}>Sample Users</button>
      </p>
      {open && (
        <div className="modal-backdrop" onClick={() => setOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginTop: 0 }}>Sample Users</h3>
            {samples.map((u) => (
              <form key={u.id} action={loginSampleUser.bind(null, u.id)}>
                <button className="btn btn-secondary" style={{ width: "100%", marginBottom: 8, textAlign: "left" }}>
                  <strong>{u.name}</strong> <span className="muted">— {u.role}</span>
                </button>
              </form>
            ))}
            <button type="button" className="btn-link" onClick={() => setOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
