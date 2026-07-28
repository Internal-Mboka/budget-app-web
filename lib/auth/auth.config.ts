import type { NextAuthConfig } from "next-auth";

import type { PermissionSlug, RoleName } from "@/lib/permissions";

export const authConfig = {
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 30,
  },
  pages: {
    signIn: "/login",
  },
  providers: [],
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.roleId = user.roleId;
        token.roleName = user.roleName;
        token.permissions = user.permissions;
        token.mustChangePassword = user.mustChangePassword ?? false;
      }

      if (trigger === "update" && session?.mustChangePassword !== undefined) {
        token.mustChangePassword = Boolean(session.mustChangePassword);
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        session.user.id = token.sub;
        session.user.roleId = typeof token.roleId === "number" ? token.roleId : 0;
        session.user.roleName = (token.roleName as RoleName | undefined) ?? "OBSERVATEUR";
        session.user.permissions = (token.permissions as PermissionSlug[] | undefined) ?? [];
        session.user.mustChangePassword = Boolean(token.mustChangePassword);
      }

      return session;
    },
  },
} satisfies NextAuthConfig;
