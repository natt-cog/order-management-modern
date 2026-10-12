import { LoginForm } from "./login-form";
import { SAMPLE_PASSWORD, SAMPLE_USERS } from "@/lib/sample-users";

export default function LoginPage() {
  const sample = process.env.ENABLE_SAMPLE_LOGIN === "true";
  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-sky-700 to-indigo-900 p-6">
      <div className="w-full max-w-sm rounded-xl bg-white p-8 shadow-xl">
        <h1 className="mb-1 text-2xl font-semibold">Order Management</h1>
        <p className="mb-6 text-sm text-slate-500">Log in to manage orders, products and accounts.</p>
        <LoginForm samples={sample ? SAMPLE_USERS.map((u) => ({ ...u, password: SAMPLE_PASSWORD })) : []} />
      </div>
    </main>
  );
}
