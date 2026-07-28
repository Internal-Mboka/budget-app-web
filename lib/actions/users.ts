"use server";

import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { sendInvitationEmail } from "@/lib/actions/invitations";
import { requirePermission } from "@/lib/auth/session";
import { ROLE_LABELS } from "@/lib/design-tokens";
import {
  buildInvitationAcceptUrl,
  createPendingUserPasswordHash,
  issueInvitationToken,
} from "@/lib/invitations/service";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import {
  createUserSchema,
  toggleUserActiveSchema,
  updateUserSchema,
} from "@/lib/validations/user";
import { resendInvitationSchema } from "@/lib/validations/invitation";

export type UserActionResult =
  | {
      success: true;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
        accountStatus: "PENDING" | "ACTIVE";
        roleId: number;
        roleName: string;
      };
      invitationSent?: boolean;
    }
  | { success: false; error: string };

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = createUserSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { firstName, lastName, email, roleId } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true, accountStatus: true },
  });

  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    return { success: false, error: "Rôle introuvable." };
  }

  const pendingPasswordHash = await createPendingUserPasswordHash();
  const auditMeta = await captureAuditRequestContext();
  const inviterName = session.user.name ?? session.user.email ?? "Un administrateur";
  const roleLabel = ROLE_LABELS[role.name] ?? role.name;

  const { user, token, expiresAt } = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: pendingPasswordHash,
        roleId,
        accountStatus: "PENDING",
        mustChangePassword: false,
        isActive: true,
      },
    });

    const issued = await issueInvitationToken(
      { userId: created.id, invitedById: session.user.id },
      tx
    );

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "USER_INVITED",
      entity: "User",
      entityId: created.id,
      userId: session.user.id,
      details: {
        targetEmail: created.email,
        targetRole: role.name,
        performedBy: session.user.email,
      },
    });

    return { user: created, token: issued.token, expiresAt: issued.expiresAt };
  });

  const inviteUrl = buildInvitationAcceptUrl(token);
  const invitationSent = await sendInvitationEmail({
    email: user.email,
    firstName: user.firstName,
    inviterName,
    roleLabel,
    inviteUrl,
    expiresAt,
  });

  revalidatePath("/admin/users");

  return {
    success: true,
    invitationSent,
    user: {
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      isActive: user.isActive,
      accountStatus: user.accountStatus,
      roleId: user.roleId,
      roleName: role.name,
    },
  };
}

export async function resendInvitationAction(formData: FormData): Promise<UserActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = resendInvitationSchema.safeParse({
    userId: formData.get("userId"),
  });

  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  const targetUser = await prisma.user.findUnique({
    where: { id: parsed.data.userId },
    include: { role: { select: { name: true } } },
  });

  if (!targetUser) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  if (targetUser.accountStatus !== "PENDING") {
    return { success: false, error: "Ce compte a déjà été activé." };
  }

  if (!targetUser.isActive) {
    return { success: false, error: "Ce compte est bloqué. Réactivez-le avant de renvoyer l'invitation." };
  }

  const auditMeta = await captureAuditRequestContext();
  const inviterName = session.user.name ?? session.user.email ?? "Un administrateur";
  const roleLabel = ROLE_LABELS[targetUser.role.name] ?? targetUser.role.name;

  const { token, expiresAt } = await issueInvitationToken({
    userId: targetUser.id,
    invitedById: session.user.id,
  });

  await writeAuditLog({
    requestMeta: auditMeta,
    captureRequest: false,
    action: "USER_INVITATION_RESENT",
    entity: "User",
    entityId: targetUser.id,
    userId: session.user.id,
    details: {
      targetEmail: targetUser.email,
      performedBy: session.user.email,
    },
  });

  const inviteUrl = buildInvitationAcceptUrl(token);
  const invitationSent = await sendInvitationEmail({
    email: targetUser.email,
    firstName: targetUser.firstName,
    inviterName,
    roleLabel,
    inviteUrl,
    expiresAt,
  });

  revalidatePath("/admin/users");

  return { success: true, invitationSent };
}

export async function updateUserAction(formData: FormData): Promise<UserActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = updateUserSchema.safeParse({
    userId: formData.get("userId"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { userId, firstName, lastName, email, roleId } = parsed.data;

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!existingUser) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  if (existingUser.accountStatus === "PENDING" && email.toLowerCase() !== existingUser.email) {
    return {
      success: false,
      error: "Impossible de modifier l'email d'un compte en attente d'invitation.",
    };
  }

  const emailTaken = await prisma.user.findFirst({
    where: {
      email: { equals: email, mode: "insensitive" },
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (emailTaken) {
    return { success: false, error: "Cet email est déjà utilisé." };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    return { success: false, error: "Rôle introuvable." };
  }

  const auditMeta = await captureAuditRequestContext();

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        roleId,
      },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "USER_UPDATED",
      entity: "User",
      entityId: updated.id,
      userId: session.user.id,
      details: {
        before: {
          firstName: existingUser.firstName,
          lastName: existingUser.lastName,
          email: existingUser.email,
          role: existingUser.role.name,
          isActive: existingUser.isActive,
        },
        after: {
          firstName: updated.firstName,
          lastName: updated.lastName,
          email: updated.email,
          role: role.name,
          isActive: updated.isActive,
        },
        performedBy: session.user.email,
      },
    });
  });

  revalidatePath("/admin/users");

  return { success: true };
}

export async function toggleUserActiveAction(formData: FormData): Promise<UserActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = toggleUserActiveSchema.safeParse({
    userId: formData.get("userId"),
    isActive: formData.get("isActive"),
  });

  if (!parsed.success) {
    return { success: false, error: "Données invalides" };
  }

  const { userId, isActive } = parsed.data;

  if (userId === session.user.id && !isActive) {
    return { success: false, error: "Vous ne pouvez pas désactiver votre propre compte." };
  }

  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: true },
  });

  if (!existingUser) {
    return { success: false, error: "Utilisateur introuvable." };
  }

  const auditMeta = await captureAuditRequestContext();

  await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { id: userId },
      data: { isActive },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: isActive ? "USER_ACTIVATED" : "USER_BLOCKED",
      entity: "User",
      entityId: updated.id,
      userId: session.user.id,
      details: {
        before: { isActive: existingUser.isActive },
        after: { isActive },
        targetEmail: updated.email,
        targetRole: existingUser.role.name,
        performedBy: session.user.email,
      },
    });
  });

  revalidatePath("/admin/users");

  return { success: true };
}
