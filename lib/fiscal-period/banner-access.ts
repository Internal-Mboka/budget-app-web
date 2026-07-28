import { hasAnyPermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";

const FISCAL_CLOSING_BANNER_PERMISSIONS = [
  PERMISSIONS.FINANCE_CREATE_REVENUE,
  PERMISSIONS.FINANCE_CREATE_EXPENSE,
  PERMISSIONS.FINANCE_VALIDATE_PAYMENT,
  PERMISSIONS.CASH_CLOSE,
  PERMISSIONS.DASHBOARD_FINANCIAL,
  PERMISSIONS.DASHBOARD_FULL,
] as const;

export function canSeeFiscalClosingBanner(permissions: string[]): boolean {
  return hasAnyPermission(permissions, [...FISCAL_CLOSING_BANNER_PERMISSIONS]);
}
