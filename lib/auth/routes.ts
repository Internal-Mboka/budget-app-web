import type { PermissionSlug } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/permissions";

export const PUBLIC_PATHS = [
  "/login",
  "/login/forgot-password",
  "/login/reset-password",
  "/login/two-factor",
  "/offline",
] as const;

export const ROUTE_PERMISSIONS: Record<string, PermissionSlug> = {
  "/dashboard": PERMISSIONS.DASHBOARD_FULL,
  "/dashboard/financier": PERMISSIONS.DASHBOARD_FINANCIAL,
  "/dashboard/operations": PERMISSIONS.DASHBOARD_OPERATIONAL,
  "/dashboard/macro": PERMISSIONS.DASHBOARD_MACRO,
  "/admin/users": PERMISSIONS.USERS_MANAGE,
  "/admin/roles": PERMISSIONS.USERS_MANAGE,
  "/clients": PERMISSIONS.FINANCE_CREATE_REVENUE,
  "/revenues": PERMISSIONS.FINANCE_CREATE_REVENUE,
  "/expenses": PERMISSIONS.FINANCE_CREATE_EXPENSE,
};

export const ROUTE_PREFIX_PERMISSIONS: Array<{ prefix: string; permission: PermissionSlug }> = [
  { prefix: "/admin", permission: PERMISSIONS.USERS_MANAGE },
  { prefix: "/audit", permission: PERMISSIONS.AUDIT_VIEW },
  { prefix: "/clients", permission: PERMISSIONS.FINANCE_CREATE_REVENUE },
  { prefix: "/revenues", permission: PERMISSIONS.FINANCE_CREATE_REVENUE },
  { prefix: "/expenses", permission: PERMISSIONS.FINANCE_CREATE_EXPENSE },
];

type DashboardSessionUser = {
  permissions: PermissionSlug[];
};

export function getDefaultDashboardPath(user: DashboardSessionUser): string {
  if (user.permissions.includes(PERMISSIONS.DASHBOARD_FULL)) {
    return "/dashboard";
  }

  if (user.permissions.includes(PERMISSIONS.DASHBOARD_FINANCIAL)) {
    return "/dashboard/financier";
  }

  if (user.permissions.includes(PERMISSIONS.DASHBOARD_OPERATIONAL)) {
    return "/dashboard/operations";
  }

  if (user.permissions.includes(PERMISSIONS.DASHBOARD_MACRO)) {
    return "/dashboard/macro";
  }

  return "/login";
}

export function canAccessRoute(pathname: string, permissions: PermissionSlug[]): boolean {
  for (const { prefix, permission } of ROUTE_PREFIX_PERMISSIONS) {
    if (pathname.startsWith(prefix) && !permissions.includes(permission)) {
      return false;
    }
  }

  const requiredPermission = ROUTE_PERMISSIONS[pathname];

  if (!requiredPermission) {
    return true;
  }

  return permissions.includes(requiredPermission);
}

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_PATHS.includes(pathname as (typeof PUBLIC_PATHS)[number])) {
    return true;
  }

  if (pathname.startsWith("/login/")) {
    return true;
  }

  return pathname.startsWith("/api/auth");
}

export const PASSWORD_CHANGE_PATH = "/account/password";

type SessionUserWithPasswordFlag = {
  permissions: PermissionSlug[];
  mustChangePassword?: boolean;
};

export function mustForcePasswordChange(
  pathname: string,
  user: SessionUserWithPasswordFlag
): boolean {
  if (!user.mustChangePassword) {
    return false;
  }

  if (pathname === PASSWORD_CHANGE_PATH) {
    return false;
  }

  if (pathname.startsWith("/api/auth")) {
    return false;
  }

  return true;
}
