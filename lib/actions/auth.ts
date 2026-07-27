"use server";

import { cookies } from "next/headers";
import { AuthError } from "next-auth";

import { revokeCurrentSessionOnLogout } from "@/lib/actions/sessions";
import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { recordFailedLoginAttempt } from "@/lib/audit/failed-login";
import { signIn, signOut } from "@/lib/auth/instance";
import { validateUserCredentials } from "@/lib/auth/credentials";
import { prisma } from "@/lib/prisma";
import {
  createTwoFactorChallenge,
  TWO_FACTOR_CHALLENGE_COOKIE,
  verifyTwoFactorChallenge,
} from "@/lib/two-factor/challenge";
import { requiresTwoFactorAtLogin } from "@/lib/two-factor/eligibility";
import { verifyTotpCode } from "@/lib/two-factor/totp";
import { completeTwoFactorLoginSchema } from "@/lib/validations/two-factor";

export type LoginActionResult =
  | { success: true; redirectTo: string }
  | { requires2FA: true; redirectTo: string }
  | { error: "invalid-credentials" | "server-error" | "invalid-code" | "challenge-expired" };

export async function loginAction(formData: FormData): Promise<LoginActionResult> {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();

  try {
    const user = await validateUserCredentials(email, password);

    if (!user) {
      await recordFailedLoginAttempt(email);
      return { error: "invalid-credentials" };
    }

    if (requiresTwoFactorAtLogin(user)) {
      const challengeToken = await createTwoFactorChallenge(user.id);
      const cookieStore = await cookies();

      cookieStore.set(TWO_FACTOR_CHALLENGE_COOKIE, challengeToken, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 5 * 60,
      });

      return {
        requires2FA: true,
        redirectTo: "/login/two-factor",
      };
    }

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (result?.error) {
      return { error: "invalid-credentials" };
    }

    return {
      success: true,
      redirectTo: callbackUrl || "/",
    };
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "invalid-credentials" };
    }

    console.error("Login action failed", error);
    return { error: "server-error" };
  }
}

export async function completeTwoFactorLoginAction(
  formData: FormData
): Promise<LoginActionResult> {
  const parsed = completeTwoFactorLoginSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: "invalid-code" };
  }

  const cookieStore = await cookies();
  const challengeCookie = cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE);

  if (!challengeCookie?.value) {
    return { error: "challenge-expired" };
  }

  const userId = await verifyTwoFactorChallenge(challengeCookie.value);

  if (!userId) {
    cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);
    return { error: "challenge-expired" };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      twoFactorEnabled: true,
      twoFactorSecret: true,
      isActive: true,
      role: { select: { name: true } },
    },
  });

  if (!user?.isActive || !user.twoFactorEnabled || !user.twoFactorSecret) {
    cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);
    return { error: "challenge-expired" };
  }

  if (!verifyTotpCode(parsed.data.code, user.twoFactorSecret)) {
    await recordFailedLoginAttempt(user.email);
    return { error: "invalid-code" };
  }

  const callbackUrl = String(formData.get("callbackUrl") ?? "").trim();
  const challengeToken = challengeCookie.value;

  cookieStore.delete(TWO_FACTOR_CHALLENGE_COOKIE);

  try {
    const result = await signIn("credentials", {
      twoFactorChallenge: challengeToken,
      redirect: false,
    });

    if (result?.error) {
      return { error: "challenge-expired" };
    }

    const auditMeta = await captureAuditRequestContext();

    await writeAuditLog({
      requestMeta: auditMeta,
      captureRequest: false,
      action: "USER_LOGIN_2FA",
      entity: "User",
      entityId: user.id,
      userId: user.id,
      details: {
        email: user.email,
        role: user.role.name,
      },
    });

    return {
      success: true,
      redirectTo: callbackUrl || "/",
    };
  } catch (error) {
    console.error("2FA login completion failed", error);
    return { error: "server-error" };
  }
}

export async function logoutAction() {
  await revokeCurrentSessionOnLogout();
  await signOut({ redirectTo: "/login" });
}
