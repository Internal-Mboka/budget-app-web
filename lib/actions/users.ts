"use server";

import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import {
  createUserSchema,
  toggleUserActiveSchema,
  updateUserSchema,
} from "@/lib/validations/user";

export type UserActionResult =
  | {
      success: true;
      user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        isActive: boolean;
        roleId: number;
        roleName: string;
      };
    }
  | { success: false; error: string };

export async function createUserAction(formData: FormData): Promise<UserActionResult> {
  const session = await requirePermission(PERMISSIONS.USERS_MANAGE);

  const parsed = createUserSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
    roleId: formData.get("roleId"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { firstName, lastName, email, password, roleId } = parsed.data;

  const existing = await prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });

  if (existing) {
    return { success: false, error: "Un compte existe déjà avec cet email." };
  }

  const role = await prisma.role.findUnique({ where: { id: roleId } });

  if (!role) {
    return { success: false, error: "Rôle introuvable." };
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const auditMeta = await captureAuditRequestContext();

  const created = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        firstName,
        lastName,
        email: email.toLowerCase(),
        password: passwordHash,
        roleId,
        mustChangePassword: true,
      },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "USER_CREATED",
      entity: "User",
      entityId: user.id,
      userId: session.user.id,
      details: {
        targetEmail: user.email,
        targetRole: role.name,
        performedBy: session.user.email,
      },
    });

    return user;
  });

  revalidatePath("/admin/users");

  return {
    success: true,
    user: {
      id: created.id,
      firstName: created.firstName,
      lastName: created.lastName,
      email: created.email,
      isActive: created.isActive,
      roleId: created.roleId,
      roleName: role.name,
    },
  };
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
