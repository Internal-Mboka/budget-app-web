/** Libellés français pour la matrice IAM (US-06). */

export const PERMISSION_LABELS: Record<string, string> = {
  "finance:create-revenue": "Saisie des entrées d'argent",
  "finance:create-expense": "Saisie des sorties d'argent",
  "finance:validate-payment": "Validation des encaissements",
  "cash:close": "Clôture de caisse",
  "finance:cancel-adjustment": "Annulation et avoirs",
  "finance:archive-transaction": "Archivage des transactions",
  "users:manage": "Gestion des utilisateurs (IAM)",
  "audit:view": "Consultation des journaux d'audit",
  "dashboard:full": "Dashboard complet macro/micro",
  "dashboard:financial": "Vue financière du dashboard",
  "dashboard:operational": "Vue opérationnelle du dashboard",
  "dashboard:macro": "Vue macro du dashboard",
};

export function getPermissionLabel(slug: string, fallback?: string | null): string {
  return PERMISSION_LABELS[slug] ?? fallback ?? slug;
}
