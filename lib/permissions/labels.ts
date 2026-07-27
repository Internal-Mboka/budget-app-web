/** Libellés et descriptions pour la matrice IAM (US-06). */

export const PERMISSION_LABELS: Record<string, string> = {
  "finance:create-revenue": "Saisie des entrées d'argent",
  "finance:create-expense": "Saisie des sorties d'argent",
  "finance:approve-expense": "Approbation des dépenses à seuil élevé",
  "finance:validate-payment": "Validation des encaissements",
  "cash:close": "Clôture de caisse",
  "cash:approve-closing": "Approbation des clôtures à écart",
  "finance:cancel-adjustment": "Annulation et avoirs",
  "finance:archive-transaction": "Archivage des revenus et dépenses",
  "users:manage": "Gestion des utilisateurs (IAM)",
  "audit:view": "Consultation des journaux d'audit",
  "dashboard:full": "Dashboard complet macro/micro",
  "dashboard:financial": "Vue financière du dashboard",
  "dashboard:operational": "Vue opérationnelle du dashboard",
  "dashboard:macro": "Vue macro du dashboard",
};

export const PERMISSION_DESCRIPTIONS: Record<string, string> = {
  "finance:create-revenue":
    "Enregistrer les recettes, prestations studio et autres entrées de trésorerie.",
  "finance:create-expense":
    "Saisir les dépenses, achats et sorties d'argent du studio.",
  "finance:approve-expense":
    "Valider ou refuser les dépenses dépassant le seuil de contrôle PDG.",
  "finance:validate-payment":
    "Valider et confirmer les encaissements avant enregistrement définitif.",
  "cash:close":
    "Effectuer la clôture de caisse en fin de journée ou de période.",
  "cash:approve-closing":
    "Valider ou régulariser les clôtures de caisse présentant un écart.",
  "finance:cancel-adjustment":
    "Créer des avoirs, annulations et régularisations sur les revenus et dépenses.",
  "finance:archive-transaction":
    "Archiver les anciens revenus et dépenses tout en conservant la traçabilité.",
  "users:manage":
    "Créer, modifier, bloquer des comptes et gérer les rôles et permissions.",
  "audit:view":
    "Consulter l'historique des actions sensibles (connexions, finances, IAM).",
  "dashboard:full":
    "Accéder à la vue dashboard complète avec indicateurs macro et micro.",
  "dashboard:financial":
    "Consulter les indicateurs financiers, caisse et trésorerie.",
  "dashboard:operational":
    "Suivre l'activité opérationnelle et les saisies du secrétariat.",
  "dashboard:macro":
    "Visualiser une synthèse macro sans accès aux actions de modification.",
};

export function getPermissionLabel(slug: string, fallback?: string | null): string {
  return PERMISSION_LABELS[slug] ?? fallback ?? slug;
}

export function getPermissionDescription(slug: string, fallback?: string | null): string {
  if (PERMISSION_DESCRIPTIONS[slug]) {
    return PERMISSION_DESCRIPTIONS[slug];
  }

  if (fallback && fallback !== PERMISSION_LABELS[slug]) {
    return fallback;
  }

  return "Habilitation applicative associée à ce rôle.";
}

export type PermissionCategoryId = "finance" | "dashboard" | "iam";

export const PERMISSION_CATEGORIES: Array<{ id: PermissionCategoryId; label: string }> = [
  { id: "finance", label: "Finance & caisse" },
  { id: "dashboard", label: "Dashboard" },
  { id: "iam", label: "IAM & audit" },
];

const PERMISSION_CATEGORY_BY_SLUG: Record<string, PermissionCategoryId> = {
  "finance:create-revenue": "finance",
  "finance:create-expense": "finance",
  "finance:approve-expense": "finance",
  "finance:validate-payment": "finance",
  "cash:close": "finance",
  "cash:approve-closing": "finance",
  "finance:cancel-adjustment": "finance",
  "finance:archive-transaction": "finance",
  "dashboard:full": "dashboard",
  "dashboard:financial": "dashboard",
  "dashboard:operational": "dashboard",
  "dashboard:macro": "dashboard",
  "users:manage": "iam",
  "audit:view": "iam",
};

export function getPermissionCategory(slug: string): PermissionCategoryId {
  return PERMISSION_CATEGORY_BY_SLUG[slug] ?? "finance";
}

export function groupPermissionsByCategory<T extends { slug: string }>(permissions: T[]) {
  const buckets = new Map<PermissionCategoryId, T[]>();

  for (const category of PERMISSION_CATEGORIES) {
    buckets.set(category.id, []);
  }

  for (const permission of permissions) {
    const categoryId = getPermissionCategory(permission.slug);
    buckets.get(categoryId)?.push(permission);
  }

  return PERMISSION_CATEGORIES.map((category) => ({
    ...category,
    permissions: buckets.get(category.id) ?? [],
  })).filter((group) => group.permissions.length > 0);
}
