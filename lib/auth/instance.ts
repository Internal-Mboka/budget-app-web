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

async function readSessionClientMeta() {
  const headerList = await headers();

  return parseSessionClientMeta(
    headerList.get("user-agent"),
    headerList.get("x-forwarded-for"),
    headerList.get("x-real-ip")
  );
}

async function attachSessionRecord(userId: string, token: Record<string, unknown>) {
  try {
    const meta = await readSessionClientMeta();
    const dbSession = await createUserSession(userId, meta);
    token.sessionId = dbSession.id;
    token.lastActiveBump = Date.now();
  } catch (error) {
    console.error("Failed to persist session record", error);
  }

  return token;
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [credentialsProvider],
  callbacks: {
    ...authConfig.callbacks,
    async jwt({ token, user, trigger, session }) {
      const nextToken = await authConfig.callbacks.jwt({ token, user, trigger, session });

      if (user?.id) {
        return attachSessionRecord(user.id, nextToken);
      }

      if (!nextToken.sub) {
        return nextToken;
      }

      const userId = String(nextToken.sub);

      if (!nextToken.sessionId) {
        await attachSessionRecord(userId, nextToken);

        if (!nextToken.sessionId) {
          return nextToken;
        }
      }

      try {
        const sessionId = String(nextToken.sessionId);
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
      } catch (error) {
        console.error("Session validation failed, keeping JWT active", error);
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
