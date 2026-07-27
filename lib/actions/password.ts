"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";

import {
  captureAuditRequestContext,
  writeAuditLog,
  type AuditRequestMeta,
} from "@/lib/audit";
import { auth, signOut } from "@/lib/auth/instance";
import { requirePermission } from "@/lib/auth/session";
import {
  notifyPasswordChanged,
  notifyPasswordResetRequested,
} from "@/lib/email/security-notifications";
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
  verifyPassword,
} from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { revokeAllUserSessions } from "@/lib/sessions/service";
import {
  adminResetPasswordSchema,
  changePasswordSchema,
  requestPasswordResetSchema,
  resetPasswordWithTokenSchema,
} from "@/lib/validations/password";

export type PasswordActionResult =
  | { success: true; redirectTo?: string }
  | { success: false; error: string };

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;

function getAppBaseUrl() {
  return process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? "http://localhost:3000";
}

async function writePasswordAudit(
  userId: string,
  action: string,
  details: Prisma.InputJsonValue,
  actorUserId?: string,
  requestMeta?: AuditRequestMeta | null
) {
  await writeAuditLog({
    requestMeta,
    captureRequest: false,
    action,
    entity: "User",
    entityId: userId,
    userId: actorUserId ?? userId,
    details,
  });
}

export async function changePasswordAction(formData: FormData): Promise<PasswordActionResult> {
  const session = await auth();

  if (!session?.user) {
    return { success: false, error: "Session expirée." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      firstName: true,
      password: true,
      mustChangePassword: true,
    },
  });

  if (!dbUser) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
    requireCurrentPassword: dbUser.mustChangePassword ? false : true,
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { currentPassword, newPassword } = parsed.data;

  if (!dbUser.mustChangePassword && currentPassword) {
    const currentMatches = await verifyPassword(currentPassword, dbUser.password);

    if (!currentMatches) {
      return { success: false, error: "Mot de passe actuel incorrect." };
    }
  }

  const sameAsOld = await verifyPassword(newPassword, dbUser.password);

  if (sameAsOld) {
    return { success: false, error: "Le nouveau mot de passe doit être différent de l'ancien." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: dbUser.id },
    data: {
      password: passwordHash,
      mustChangePassword: false,
    },
  });

  const auditMeta = await captureAuditRequestContext();

  await writePasswordAudit(dbUser.id, "PASSWORD_CHANGED", {
    context: dbUser.mustChangePassword ? "first_login" : "self_change",
    email: dbUser.email,
  }, undefined, auditMeta);

  await notifyPasswordChanged({
    email: dbUser.email,
    firstName: dbUser.firstName,
    context: dbUser.mustChangePassword ? "first_login" : "self_change",
  });

  revalidatePath("/account/password");

  await revokeAllUserSessions(dbUser.id);
  await signOut({ redirect: false });

  return {
    success: true,
    redirectTo: dbUser.mustChangePassword
      ? "/login?message=password-updated-first-login"
      : "/login?message=password-updated",
  };
}

export async function requestPasswordResetAction(
  formData: FormData
): Promise<PasswordActionResult> {
  const parsed = requestPasswordResetSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const email = parsed.data.email.toLowerCase();

  const user = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" }, isActive: true },
    select: { id: true, email: true, firstName: true },
  });

  if (user) {
    const { token, tokenHash } = createPasswordResetToken();
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await prisma.passwordResetToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    const resetUrl = `${getAppBaseUrl()}/login/reset-password?token=${token}`;

    await notifyPasswordResetRequested(user.email, resetUrl);

    const auditMeta = await captureAuditRequestContext();

    await writePasswordAudit(user.id, "PASSWORD_RESET_REQUESTED", {
      email: user.email,
    }, undefined, auditMeta);
  }

  return {
    success: true,
    redirectTo: "/login?message=reset-email-sent",
  };
}

export async function resetPasswordWithTokenAction(
  formData: FormData
): Promise<PasswordActionResult> {
  const parsed = resetPasswordWithTokenSchema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { token, newPassword } = parsed.data;
  const tokenHash = hashPasswordResetToken(token);

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          firstName: true,
          password: true,
          isActive: true,
        },
      },
    },
  });

  if (!resetToken || resetToken.expiresAt < new Date() || !resetToken.user.isActive) {
    return { success: false, error: "Lien de réinitialisation invalide ou expiré." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: {
        password: passwordHash,
        mustChangePassword: false,
      },
    }),
    prisma.passwordResetToken.delete({ where: { id: resetToken.id } }),
  ]);

  await revokeAllUserSessions(resetToken.userId);

  const auditMeta = await captureAuditRequestContext();

  await writePasswordAudit(resetToken.userId, "PASSWORD_RESET_COMPLETED", {
    email: resetToken.user.email,
    context: "forgot_reset",
  }, undefined, auditMeta);

  await notifyPasswordChanged({
    email: resetToken.user.email,
    firstName: resetToken.user.firstName,
    context: "forgot_reset",
  });

  return { success: true, redirectTo: "/login?message=password-reset-success" };
}

export async function adminResetPasswordAction(
  formData: FormData
): Promise<PasswordActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = adminResetPasswordSchema.safeParse({
    userId: formData.get("userId"),
    newPassword: formData.get("newPassword"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { userId, newPassword } = parsed.data;

  if (userId === session.user.id) {
    return {
      success: false,
      error: "Utilisez la page « Mot de passe » pour modifier votre propre mot de passe.",
    };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, firstName: true },
  });

  if (!targetUser) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  const passwordHash = await hashPassword(newPassword);

  await prisma.user.update({
    where: { id: userId },
    data: {
      password: passwordHash,
      mustChangePassword: true,
    },
  });

  await revokeAllUserSessions(userId);

  const auditMeta = await captureAuditRequestContext();

  await writePasswordAudit(
    userId,
    "PASSWORD_ADMIN_RESET",
    {
      targetEmail: targetUser.email,
      performedBy: session.user.email,
    },
    session.user.id,
    auditMeta
  );

  await notifyPasswordChanged({
    email: targetUser.email,
    firstName: targetUser.firstName,
    context: "admin_reset",
  });

  revalidatePath("/admin/users");

  return { success: true };
}
