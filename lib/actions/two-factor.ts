"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import {
  TWO_FACTOR_CHALLENGE_COOKIE,
  verifyTwoFactorChallenge,
} from "@/lib/two-factor/challenge";
import { createTotpQrDataUrl, createTotpSecret, verifyTotpCode } from "@/lib/two-factor/totp";
import {
  confirmTwoFactorSchema,
  disableTwoFactorSchema,
} from "@/lib/validations/two-factor";

export type TwoFactorActionResult =
  | { success: true; qrDataUrl?: string }
  | { success: false; error: string };

export async function beginTwoFactorSetupAction(): Promise<TwoFactorActionResult> {
  const session = await requireSession();

  const secret = createTotpSecret();

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorSecret: secret,
      twoFactorEnabled: false,
    },
  });

  const qrDataUrl = await createTotpQrDataUrl(session.user.email ?? "user@mboka.studio", secret);

  revalidatePath("/account/two-factor");

  return { success: true, qrDataUrl };
}

export async function confirmTwoFactorSetupAction(
  formData: FormData
): Promise<TwoFactorActionResult> {
  const session = await requireSession();

  const parsed = confirmTwoFactorSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Code invalide." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorSecret: true },
  });

  if (!user?.twoFactorSecret) {
    return { success: false, error: "Configuration 2FA introuvable. Relancez l'activation." };
  }

  if (!verifyTotpCode(parsed.data.code, user.twoFactorSecret)) {
    return { success: false, error: "Code incorrect. Vérifiez l'heure de votre appareil." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { twoFactorEnabled: true },
  });

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "TWO_FACTOR_ENABLED",
    entity: "User",
    entityId: session.user.id,
    userId: session.user.id,
    details: {
      email: session.user.email,
      role: session.user.roleName,
    },
  });

  revalidatePath("/account/two-factor");

  return { success: true };
}

export async function disableTwoFactorAction(formData: FormData): Promise<TwoFactorActionResult> {
  const session = await requireSession();

  const parsed = disableTwoFactorSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Code invalide." };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { twoFactorEnabled: true, twoFactorSecret: true },
  });

  if (!user?.twoFactorEnabled || !user.twoFactorSecret) {
    return { success: false, error: "La 2FA n'est pas activée sur ce compte." };
  }

  if (!verifyTotpCode(parsed.data.code, user.twoFactorSecret)) {
    return { success: false, error: "Code incorrect." };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      twoFactorEnabled: false,
      twoFactorSecret: null,
    },
  });

  const auditMeta = await captureAuditRequestContext();

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "TWO_FACTOR_DISABLED",
    entity: "User",
    entityId: session.user.id,
    userId: session.user.id,
    details: {
      email: session.user.email,
      role: session.user.roleName,
    },
  });

  revalidatePath("/account/two-factor");

  return { success: true };
}

export async function getTwoFactorChallengeEmail(): Promise<string | null> {
  const cookieStore = await cookies();
  const challengeCookie = cookieStore.get(TWO_FACTOR_CHALLENGE_COOKIE);

  if (!challengeCookie?.value) {
    return null;
  }

  const userId = await verifyTwoFactorChallenge(challengeCookie.value);

  if (!userId) {
    return null;
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  return user?.email ?? null;
}
