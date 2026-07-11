import { UserRole } from "@prisma/client";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { prisma } from "@/lib/prisma";

const SESSION_COOKIE = "session_user_id";

const HISTORY_EXPORT_ROLES: UserRole[] = [
  UserRole.PDG,
  UserRole.COMPTABLE,
  UserRole.DG,
  UserRole.DIRECTEUR_TECHNIQUE,
];

export function normalizeRole(rawRole: string): UserRole {
  const cleaned = rawRole.trim().toLowerCase();

  if (cleaned.includes("pdg")) {
    return UserRole.PDG;
  }

  if (cleaned.includes("comptable")) {
    return UserRole.COMPTABLE;
  }

  if (cleaned === "dg" || cleaned.includes("directeur general")) {
    return UserRole.DG;
  }

  if (cleaned.includes("directeur technique") || cleaned === "dt") {
    return UserRole.DIRECTEUR_TECHNIQUE;
  }

  return UserRole.OBSERVATEUR;
}

export function canEditByRole(role: UserRole): boolean {
  return role === UserRole.PDG || role === UserRole.COMPTABLE;
}

export function canAccessHistoryAndExport(role: UserRole): boolean {
  return HISTORY_EXPORT_ROLES.includes(role);
}

export async function setSessionUser(userId: string) {
  const cookieStore = await cookies();

  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSessionUser() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export async function getSessionUserId(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(SESSION_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const userId = await getSessionUserId();

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });
}

export async function requireCurrentUser() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/");
  }

  return user;
}
