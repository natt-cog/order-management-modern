import NextAuth, { type DefaultSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db, schema } from "@/db";
import type { Role } from "@/lib/permissions";
import { authConfig } from "@/auth.config";

declare module "next-auth" {
  interface Session {
    user: { id: string; role: Role } & DefaultSession["user"];
  }
  interface User {
    role?: Role;
  }
}

const credentialsSchema = z.object({ username: z.string().min(1), password: z.string().min(1) });

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { username: {}, password: {} },
      async authorize(raw) {
        const parsed = credentialsSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await db.query.users.findFirst({ where: eq(schema.users.username, parsed.data.username.trim().toLowerCase()) });
        if (!user || !user.isActive || !(await bcrypt.compare(parsed.data.password, user.passwordHash))) return null;
        return { id: String(user.id), name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
});
