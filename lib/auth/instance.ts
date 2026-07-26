import NextAuth from "next-auth";

import { prisma } from "@/lib/prisma";

import { authConfig } from "./auth.config";
import { credentialsProvider } from "./providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
  events: {
    async signIn({ user }) {
      if (!user?.id) {
        return;
      }

      try {
        await prisma.auditLog.create({
          data: {
            action: "USER_LOGIN",
            entity: "User",
            entityId: user.id,
            userId: user.id,
            details: {
              email: user.email,
              role: user.roleName,
            },
          },
        });
      } catch (error) {
        console.error("Login audit log failed", error);
      }
    },
  },
});
