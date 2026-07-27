import { prisma } from "@/lib/prisma";

export type AccountProfile = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl: string | null;
  twoFactorEnabled: boolean;
  createdAt: Date;
  roleName: string;
};

export async function loadAccountProfile(userId: string): Promise<AccountProfile | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      avatarUrl: true,
      twoFactorEnabled: true,
      createdAt: true,
      role: { select: { name: true } },
    },
  });

  if (!user) {
    return null;
  }

  return {
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    avatarUrl: user.avatarUrl,
    twoFactorEnabled: user.twoFactorEnabled,
    createdAt: user.createdAt,
    roleName: user.role.name,
  };
}

export function getAccountProfileDisplayName(profile: Pick<AccountProfile, "firstName" | "lastName">): string {
  return `${profile.firstName} ${profile.lastName}`.trim();
}

export function getAccountProfileInitials(profile: Pick<AccountProfile, "firstName" | "lastName">): string {
  const parts = [profile.firstName, profile.lastName].filter(Boolean);

  return parts
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}
