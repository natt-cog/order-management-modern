import type { NextAuthConfig } from "next-auth";
import type { Role } from "@/lib/permissions";

// Edge-safe config shared by middleware and the full Auth.js instance.
export const authConfig = {
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      session.user.id = token.uid as string;
      session.user.role = token.role as Role;
      return session;
    },
    authorized({ auth, request }) {
      return request.nextUrl.pathname.startsWith("/login") || request.nextUrl.pathname.startsWith("/recover-password") || !!auth?.user;
    },
  },
} satisfies NextAuthConfig;
