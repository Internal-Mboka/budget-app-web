/** Slugs RBAC alignés sur la matrice de `thisproject/conception.md`. */

export const PERMISSIONS = {
  FINANCE_CREATE_REVENUE: "finance:create-revenue",
  FINANCE_CREATE_EXPENSE: "finance:create-expense",
  FINANCE_APPROVE_EXPENSE: "finance:approve-expense",
  FINANCE_VALIDATE_PAYMENT: "finance:validate-payment",
  CASH_CLOSE: "cash:close",
  CASH_APPROVE_CLOSING: "cash:approve-closing",
  FINANCE_CANCEL_ADJUSTMENT: "finance:cancel-adjustment",
  FINANCE_ARCHIVE_TRANSACTION: "finance:archive-transaction",
  USERS_MANAGE: "users:manage",
  AUDIT_VIEW: "audit:view",
  DASHBOARD_FULL: "dashboard:full",
  DASHBOARD_FINANCIAL: "dashboard:financial",
  DASHBOARD_OPERATIONAL: "dashboard:operational",
  DASHBOARD_MACRO: "dashboard:macro",
} as const;

export type PermissionSlug = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ROLES = {
  PDG: "PDG",
  DIRECTEUR_TECHNIQUE: "DIRECTEUR_TECHNIQUE",
  COMPTABLE: "COMPTABLE",
  SECRETAIRE: "SECRETAIRE",
  OBSERVATEUR: "OBSERVATEUR",
  ANONYMOUS: "ANONYMOUS",
} as const;

export type RoleName = (typeof ROLES)[keyof typeof ROLES];
