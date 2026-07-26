import bcrypt from "bcryptjs";

import { prisma } from "@/lib/prisma";
import type { PermissionSlug, RoleName } from "@/lib/permissions";

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  roleId: number;
  roleName: RoleName;
  permissions: PermissionSlug[];
  mustChangePassword: boolean;
  twoFactorEnabled: boolean;
  twoFactorSecret: string | null;
};

export async function findAuthenticatedUser(email: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findFirst({
    where: {
      email: {
        equals: email,
        mode: "insensitive",
      },
    },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const permissions = user.role.permissions.map(
    (permission) => permission.slug as PermissionSlug
  );

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    roleId: user.roleId,
    roleName: user.role.name as RoleName,
    permissions,
    mustChangePassword: user.mustChangePassword,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorSecret: user.twoFactorSecret,
  };
}

export async function validateUserCredentials(
  email: string,
  password: string
): Promise<AuthenticatedUser | null> {
  const user = await findAuthenticatedUser(email);

  if (!user) {
    return null;
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    select: { password: true },
  });

  if (!dbUser) {
    return null;
  }

  const passwordMatches = await bcrypt.compare(password, dbUser.password);

  if (!passwordMatches) {
    return null;
  }

  return user;
}

export async function findAuthenticatedUserById(userId: string): Promise<AuthenticatedUser | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: true,
        },
      },
    },
  });

  if (!user || !user.isActive) {
    return null;
  }

  const permissions = user.role.permissions.map(
    (permission) => permission.slug as PermissionSlug
  );

  return {
    id: user.id,
    email: user.email,
    name: `${user.firstName} ${user.lastName}`,
    roleId: user.roleId,
    roleName: user.role.name as RoleName,
    permissions,
    mustChangePassword: user.mustChangePassword,
    twoFactorEnabled: user.twoFactorEnabled,
    twoFactorSecret: user.twoFactorSecret,
  };
}

export function toAuthUser(user: AuthenticatedUser) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    roleId: user.roleId,
    roleName: user.roleName,
    permissions: user.permissions,
    mustChangePassword: user.mustChangePassword,
  };
}
