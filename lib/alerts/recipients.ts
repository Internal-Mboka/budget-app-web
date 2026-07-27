import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

/** Emails actifs des utilisateurs avec accès direction (PDG / DT). */
export async function loadLeadershipAlertRecipients(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        permissions: {
          some: { slug: PERMISSIONS.DASHBOARD_FULL },
        },
      },
    },
    select: { email: true },
  });

  return [...new Set(users.map((user) => user.email.trim()).filter(Boolean))];
}
