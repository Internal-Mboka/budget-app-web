import NextAuth from "next-auth";
import { headers } from "next/headers";

import { prisma } from "@/lib/prisma";
import {
  createUserSession,
  isUserSessionActive,
  shouldTouchSession,
  touchUserSession,
} from "@/lib/sessions/service";
import { parseSessionClientMeta } from "@/lib/sessions/user-agent";

import { authConfig } from "./auth.config";
import { credentialsProvider } from "./providers";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const nextToken = await authConfig.callbacks.jwt({ token, user, trigger, session });

      if (user?.id) {
        const headerList = await headers();
        const meta = parseSessionClientMeta(
          headerList.get("user-agent"),
          headerList.get("x-forwarded-for"),
          headerList.get("x-real-ip")
        );
        const dbSession = await createUserSession(user.id, meta);
        nextToken.sessionId = dbSession.id;
        nextToken.lastActiveBump = Date.now();
        return nextToken;
      }

      if (!nextToken.sub) {
        return nextToken;
      }

      if (!nextToken.sessionId) {
        return null;
      }

      const sessionId = String(nextToken.sessionId);
      const userId = String(nextToken.sub);
      const isActive = await isUserSessionActive(sessionId, userId);

      if (!isActive) {
        return null;
      }

      const lastActiveBump =
        typeof nextToken.lastActiveBump === "number" ? nextToken.lastActiveBump : undefined;

      if (shouldTouchSession(lastActiveBump)) {
        await touchUserSession(sessionId);
        nextToken.lastActiveBump = Date.now();
      }

      return nextToken;
    },
    async session({ session, token }) {
      const nextSession = await authConfig.callbacks.session({ session, token });

      if (nextSession.user && token.sessionId) {
        nextSession.user.sessionId = String(token.sessionId);
      }

      return nextSession;
    },
  },
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
