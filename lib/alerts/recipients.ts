import { PERMISSIONS, ROLES, type RoleName } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { STEALTH_ROLE_NAME } from "@/lib/stealth";

function uniqueEmails(emails: string[]): string[] {
  return [...new Set(emails.map((email) => email.trim()).filter(Boolean))];
}

/** Emails actifs des utilisateurs avec accès direction (PDG / DT). */
export async function loadLeadershipAlertRecipients(): Promise<string[]> {
  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        name: { not: STEALTH_ROLE_NAME },
        permissions: {
          some: { slug: PERMISSIONS.DASHBOARD_FULL },
        },
      },
    },
    select: { email: true },
  });

  return uniqueEmails(users.map((user) => user.email));
}

export async function loadActiveUserEmailsByRoleNames(roleNames: RoleName[]): Promise<string[]> {
  if (roleNames.length === 0) {
    return [];
  }

  const users = await prisma.user.findMany({
    where: {
      isActive: true,
      role: {
        name: {
          in: roleNames.filter((name) => name !== STEALTH_ROLE_NAME),
        },
      },
    },
    select: { email: true },
  });

  return uniqueEmails(users.map((user) => user.email));
}

/** US-78/US-54 : Comptable + direction lors du passage en CLOSING. */
export async function loadFiscalPeriodClosingPendingRecipients(): Promise<string[]> {
  const [leadership, accountants] = await Promise.all([
    loadLeadershipAlertRecipients(),
    loadActiveUserEmailsByRoleNames([ROLES.COMPTABLE]),
  ]);

  return uniqueEmails([...leadership, ...accountants]);
}

/** US-78/US-54 : PDG seul pour la validation finale après visa comptable. */
export async function loadFiscalPeriodClosingPdgRecipients(): Promise<string[]> {
  return loadActiveUserEmailsByRoleNames([ROLES.PDG]);
}

/** US-79/US-54 : Direction + Comptable après clôture ou ouverture T+1. */
export async function loadFiscalPeriodClosingOutcomeRecipients(): Promise<string[]> {
  return loadFiscalPeriodClosingPendingRecipients();
}
