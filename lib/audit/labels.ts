const AUDIT_ACTION_LABELS: Record<string, string> = {
  USER_LOGIN: "Connexion réussie",
  USER_LOGIN_2FA: "Connexion 2FA réussie",
  USER_LOGOUT: "Déconnexion",
  LOGIN_FAILED: "Échec de connexion",
  SECURITY_ALERT: "Alerte sécurité",
  USER_CREATED: "Utilisateur créé",
  USER_UPDATED: "Utilisateur modifié",
  USER_DEACTIVATED: "Utilisateur désactivé",
  USER_ACTIVATED: "Utilisateur activé",
  ROLE_PERMISSIONS_UPDATED: "Permissions rôle modifiées",
  PASSWORD_CHANGED: "Mot de passe modifié",
  SESSION_REVOKED: "Session révoquée",
  TWO_FACTOR_ENABLED: "2FA activée",
  TWO_FACTOR_DISABLED: "2FA désactivée",
  CLIENT_CREATED: "Client créé",
  CLIENT_UPDATED: "Client modifié",
  CLIENT_ARCHIVED: "Client archivé",
  CLIENT_RESTORED: "Client restauré",
  CLIENT_NOTE_CREATED: "Note client ajoutée",
  REVENUE_CREATED: "Revenu enregistré",
  REVENUE_PAYMENT_RECORDED: "Encaissement enregistré",
  REVENUE_CANCELLED: "Revenu annulé",
  EXPENSE_CREATED: "Dépense enregistrée",
  EXPENSE_APPROVED: "Dépense approuvée",
  EXPENSE_REJECTED: "Dépense refusée",
  EXPENSE_ADJUSTMENT_CREATED: "Avoir / régularisation",
  EXPENSE_ATTACHMENT_ADDED: "Pièce jointe ajoutée",
  CASH_ADVANCE_REQUESTED: "Avance de caisse demandée",
  CASH_ADVANCE_APPROVED: "Avance de caisse approuvée",
  CASH_ADVANCE_REJECTED: "Avance de caisse refusée",
  CASH_ADVANCE_DISBURSED: "Avance de caisse décaissée",
  RECURRING_EXPENSE_CREATED: "Dépense récurrente créée",
  RECURRING_EXPENSE_DUE_GENERATED: "Échéance récurrente générée",
  CASH_CLOSING_CREATED: "Clôture de caisse",
  CASH_CLOSING_REVIEW_APPROVED: "Clôture validée (PDG)",
  CASH_CLOSING_REVIEW_RESOLVED: "Clôture régularisée (PDG)",
  AUDIT_LOG_EXPORTED: "Export des journaux d'audit",
};

const AUDIT_ENTITY_LABELS: Record<string, string> = {
  User: "Utilisateur",
  Client: "Client",
  Transaction: "Transaction",
  CashClosing: "Clôture de caisse",
  Role: "Rôle",
  AuditLog: "Journal d'audit",
  UserSession: "Session",
};

export function getAuditActionLabel(action: string): string {
  return AUDIT_ACTION_LABELS[action] ?? action.replaceAll("_", " ").toLowerCase();
}

export function getAuditEntityLabel(entity: string): string {
  return AUDIT_ENTITY_LABELS[entity] ?? entity;
}

export const AUDIT_ACTION_OPTIONS = Object.entries(AUDIT_ACTION_LABELS).map(([value, label]) => ({
  value,
  label,
}));
