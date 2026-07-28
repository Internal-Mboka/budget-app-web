import { randomBytes } from "crypto";

import type { Prisma } from "@prisma/client";

import { getAppBaseUrl } from "@/lib/app-url";
import { INVITE_TOKEN_TTL_MS } from "@/lib/invitations/constants";
import { ROLE_LABELS } from "@/lib/design-tokens";
import {
  createPasswordResetToken,
  hashPassword,
  hashPasswordResetToken,
} from "@/lib/password";
import { prisma } from "@/lib/prisma";

type PrismaClientLike = Prisma.TransactionClient | typeof prisma;

export type InvitationPreview = {
  firstName: string;
  lastName: string;
  email: string;
  roleLabel: string;
  inviterName: string;
  expiresAt: Date;
};

export function buildInvitationAcceptUrl(token: string): string {
  return `${getAppBaseUrl().replace(/\/$/, "")}/invite/accept?token=${token}`;
}

export async function createPendingUserPasswordHash(): Promise<string> {
  return hashPassword(randomBytes(32).toString("hex"));
}

export async function issueInvitationToken(
  input: { userId: string; invitedById: string },
  client: PrismaClientLike = prisma
): Promise<{ token: string; expiresAt: Date }> {
  const { token, tokenHash } = createPasswordResetToken();
  const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

  await client.invitationToken.deleteMany({ where: { userId: input.userId } });
  await client.invitationToken.create({
    data: {
      userId: input.userId,
      invitedById: input.invitedById,
      tokenHash,
      expiresAt,
    },
  });

  return { token, expiresAt };
}

export async function loadInvitationPreview(rawToken: string): Promise<InvitationPreview | null> {
  const token = rawToken.trim();

  if (!token) {
    return null;
  }

  const tokenHash = hashPasswordResetToken(token);

  const invitation = await prisma.invitationToken.findUnique({
    where: { tokenHash },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
          accountStatus: true,
          isActive: true,
          role: { select: { name: true } },
        },
      },
      invitedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  });

  if (
    !invitation ||
    invitation.expiresAt < new Date() ||
    !invitation.user.isActive ||
    invitation.user.accountStatus !== "PENDING"
  ) {
    return null;
  }

  return {
    firstName: invitation.user.firstName,
    lastName: invitation.user.lastName,
    email: invitation.user.email,
    roleLabel: ROLE_LABELS[invitation.user.role.name] ?? invitation.user.role.name,
    inviterName: `${invitation.invitedBy.firstName} ${invitation.invitedBy.lastName}`,
    expiresAt: invitation.expiresAt,
  };
}

export async function acceptInvitation(input: {
  rawToken: string;
  newPassword: string;
}): Promise<{ userId: string; email: string; firstName: string }> {
  const tokenHash = hashPasswordResetToken(input.rawToken.trim());
  const passwordHash = await hashPassword(input.newPassword);

  const activated = await prisma.$transaction(async (tx) => {
    const current = await tx.invitationToken.findUnique({
      where: { tokenHash },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            accountStatus: true,
            isActive: true,
          },
        },
      },
    });

    if (
      !current ||
      current.expiresAt < new Date() ||
      !current.user.isActive ||
      current.user.accountStatus !== "PENDING"
    ) {
      throw new Error("INVITATION_INVALID");
    }

    await tx.user.update({
      where: { id: current.userId },
      data: {
        password: passwordHash,
        accountStatus: "ACTIVE",
        mustChangePassword: false,
      },
    });

    await tx.invitationToken.delete({ where: { id: current.id } });

    return current.user;
  });

  return {
    userId: activated.id,
    email: activated.email,
    firstName: activated.firstName,
  };
}
