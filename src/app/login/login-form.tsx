"use client";
import { useActionState, useRef } from "react";
import { login } from "@/app/actions";

type Sample = { username: string; name: string; title: string; password: string };

export function LoginForm({ samples }: { samples: Sample[] }) {
  const [error, action, pending] = useActionState(login, undefined);
  const form = useRef<HTMLFormElement>(null);
  const as = (s: Sample) => {
    const f = form.current!;
    (f.elements.namedItem("username") as HTMLInputElement).value = s.username;
    (f.elements.namedItem("password") as HTMLInputElement).value = s.password;
    f.requestSubmit();
  };
  return (
    <>
      <form ref={form} action={action} className="space-y-3">
        <input name="username" placeholder="Username" aria-label="Username" className="w-full rounded border px-3 py-2" />
        <input name="password" type="password" placeholder="Password" aria-label="Password" className="w-full rounded border px-3 py-2" />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button disabled={pending} className="w-full rounded bg-sky-700 py-2 font-medium text-white hover:bg-sky-800">Login</button>
      </form>
      {samples.length > 0 && (
        <div className="mt-6 border-t pt-4">
          <p className="mb-2 text-xs font-semibold uppercase text-slate-500">Sample Users</p>
          {samples.map((s) => (
            <button key={s.username} type="button" onClick={() => as(s)} className="mb-2 flex w-full justify-between rounded border px-3 py-2 text-left text-sm hover:bg-slate-50">
              <span>{s.name}</span><span className="text-slate-500">{s.title}</span>
            </button>
          ))}
        </div>
      )}
    </>
  );
}
