import { inArray } from "drizzle-orm";
import { db, schema as s } from "@/db";
import { SAMPLE_USERNAMES } from "./actions";
import LoginForm from "./LoginForm";

export const dynamic = "force-dynamic";

const ROLE_LABEL: Record<string, string> = {
  "manuel.luis@observeverything.example": "Sales representative",
  "ana.martins@observeverything.example": "Sales representative",
  "jose.felix@observeverything.example": "Sales manager",
};

export default async function LoginPage() {
  const rows = await db.select({ id: s.users.id, name: s.users.name, username: s.users.username })
    .from(s.users).where(inArray(s.users.username, SAMPLE_USERNAMES));
  const samples = SAMPLE_USERNAMES.map((u) => rows.find((r) => r.username === u)).filter((r) => !!r)
    .map((r) => ({ id: r.id, name: r.name, role: ROLE_LABEL[r.username] }));
  return (
    <div className="login-wrap">
      <div className="login-card">
        <h1 style={{ marginTop: 0 }}>Order Management</h1>
        <LoginForm samples={samples} />
      </div>
    </div>
  );
}
