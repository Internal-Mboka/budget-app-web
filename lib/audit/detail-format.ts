import { format, isValid, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import type { ApprovalStatus } from "@prisma/client";

import { getClientCategoryLabel } from "@/lib/clients/categories";
import { formatMoney } from "@/lib/currency";
import { ROLE_LABELS } from "@/lib/design-tokens";
import { getApprovalStatusLabel } from "@/lib/expenses/approval";
import { getExpenseCategoryLabel } from "@/lib/expenses/categories";
import {
  buildStaffPayrollLabel,
  parseStaffPayrollMetadata,
  type StaffPayrollMetadata,
} from "@/lib/expenses/staff-payroll";
import { getRevenueCategoryLabel } from "@/lib/revenues/categories";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { getPaymentStatusLabel } from "@/lib/transactions/labels";

const FIELD_LABELS: Record<string, string> = {
  code: "Code",
  label: "Libellé",
  name: "Nom",
  message: "Message",
  notes: "Notes",
  email: "Email",
  phone: "Téléphone",
  address: "Adresse",
  firstName: "Prénom",
  lastName: "Nom",
  role: "Rôle",
  roleName: "Rôle",
  isActive: "Statut du compte",
  category: "Catégorie client",
  expenseCategory: "Catégorie de dépense",
  expenseCategoryLabel: "Catégorie de dépense",
  revenueCategory: "Catégorie de revenu",
  revenueCategoryLabel: "Catégorie de revenu",
  totalAmount: "Montant total",
  paymentAmount: "Montant encaissé",
  paidAmount: "Montant payé",
  previousPaidAmount: "Montant payé avant",
  remainingAmount: "Reste à payer",
  paymentMethod: "Mode de paiement",
  status: "Statut de paiement",
  approvalStatus: "Statut d'approbation",
  requiresApproval: "Approbation requise",
  clientId: "Identifiant client",
  clientName: "Client",
  entityId: "Référence",
  tag: "Tag",
  tags: "Tags",
  permission: "Permission",
  permissionSlug: "Permission",
  permissionSlugs: "Permissions",
  permissions: "Permissions",
  enabled: "État",
  filename: "Fichier",
  mimeType: "Type de fichier",
  fileSize: "Taille du fichier",
  reason: "Motif",
  realizedAt: "Date de réalisation",
  closingDate: "Date de clôture",
  varianceAmount: "Écart de caisse",
  expectedCash: "Espèces attendues",
  countedCash: "Espèces comptées",
  ipAddress: "Adresse IP",
  emailAttempted: "Email saisi",
  failureCount: "Tentatives échouées",
  deviceType: "Type d'appareil",
  browser: "Navigateur",
  format: "Format d'export",
  importedCount: "Nombre importé",
  targetEmail: "Compte concerné",
  targetRole: "Rôle du compte",
  staffPayroll: "Paie / cachet staff",
  adjustmentType: "Type d'ajustement",
  originalTransactionCode: "Référence d'origine",
  cancellationReason: "Motif d'annulation",
  frequency: "Fréquence",
  nextDueDate: "Prochaine échéance",
  templateLabel: "Libellé du modèle",
  reviewStatus: "Statut de revue",
  reviewNote: "Note de revue",
  morningFloat: "Fond de caisse du matin",
  action: "Type d'action",
  entity: "Type d'enregistrement",
  userId: "Utilisateur",
  from: "Du",
  to: "Au",
};

const FIELD_ORDER = [
  "code",
  "name",
  "label",
  "templateLabel",
  "message",
  "clientName",
  "category",
  "expenseCategoryLabel",
  "revenueCategoryLabel",
  "totalAmount",
  "paymentAmount",
  "previousPaidAmount",
  "paidAmount",
  "remainingAmount",
  "paymentMethod",
  "status",
  "approvalStatus",
  "requiresApproval",
  "staffPayroll",
  "notes",
  "realizedAt",
  "closingDate",
  "varianceAmount",
  "expectedCash",
  "countedCash",
  "morningFloat",
  "reason",
  "cancellationReason",
  "roleName",
  "permissionSlug",
  "enabled",
  "filename",
  "importedCount",
  "targetEmail",
  "targetRole",
  "emailAttempted",
  "failureCount",
  "format",
  "firstName",
  "lastName",
  "email",
  "phone",
  "role",
  "isActive",
];

const HIDDEN_FIELDS = new Set(["performedBy", "metadata", "staffPayroll", "before", "after"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getFieldOrder(key: string): number {
  const index = FIELD_ORDER.indexOf(key);

  if (index >= 0) {
    return index;
  }

  if (key.startsWith("metadata.")) {
    return FIELD_ORDER.indexOf("notes") + 0.1;
  }

  return 999;
}

function isMoneyField(key: string): boolean {
  return /amount|total|variance|cash|float|paid|remaining/i.test(key) && key !== "paymentMethod";
}

function isDateField(key: string): boolean {
  return /At$|Date$/.test(key) || key === "from" || key === "to";
}

function formatDateValue(value: unknown): string | null {
  if (typeof value !== "string" && !(value instanceof Date)) {
    return null;
  }

  const date = value instanceof Date ? value : parseISO(value);

  if (!isValid(date)) {
    return null;
  }

  return format(date, "d MMMM yyyy · HH:mm", { locale: fr });
}

export function getAuditDetailFieldLabel(key: string): string {
  if (FIELD_LABELS[key]) {
    return FIELD_LABELS[key];
  }

  const normalized = key
    .replace(/^metadata\./, "")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .trim();

  return normalized.charAt(0).toUpperCase() + normalized.slice(1);
}

export function formatAuditDetailValue(key: string, value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "—";
  }

  if (typeof value === "boolean") {
    if (key === "isActive") {
      return value ? "Actif" : "Inactif";
    }

    if (key === "requiresApproval" || key === "enabled") {
      return value ? "Oui" : "Non";
    }

    return value ? "Oui" : "Non";
  }

  if (isMoneyField(key)) {
    const amount = Number(value);

    if (Number.isFinite(amount)) {
      return formatMoney(amount);
    }
  }

  if (isDateField(key)) {
    const formatted = formatDateValue(value);

    if (formatted) {
      return formatted;
    }
  }

  if (key === "paymentMethod") {
    return getPaymentMethodLabel(String(value));
  }

  if (key === "expenseCategory" || key === "expenseCategoryLabel") {
    return getExpenseCategoryLabel(String(value));
  }

  if (key === "revenueCategory" || key === "revenueCategoryLabel") {
    return getRevenueCategoryLabel(String(value));
  }

  if (key === "category") {
    return getClientCategoryLabel(String(value));
  }

  if (key === "status") {
    return getPaymentStatusLabel(String(value));
  }

  if (key === "approvalStatus") {
    return getApprovalStatusLabel(String(value) as ApprovalStatus);
  }

  if (key === "role" || key === "targetRole") {
    return ROLE_LABELS[String(value)] ?? String(value);
  }

  if (key === "fileSize" && typeof value === "number") {
    if (value < 1024) {
      return `${value} o`;
    }

    if (value < 1024 * 1024) {
      return `${Math.round(value / 1024)} Ko`;
    }

    return `${(value / (1024 * 1024)).toFixed(1)} Mo`;
  }

  if (Array.isArray(value)) {
    return value.map((entry) => formatAuditDetailValue(key, entry)).join(", ");
  }

  if (isPlainObject(value)) {
    return Object.entries(value)
      .map(([entryKey, entryValue]) => {
        const label = getAuditDetailFieldLabel(entryKey);
        return `${label} : ${formatAuditDetailValue(entryKey, entryValue)}`;
      })
      .join("\n");
  }

  return String(value);
}

export function shouldHideAuditDetailField(key: string, snapshot: Record<string, unknown>): boolean {
  if (HIDDEN_FIELDS.has(key)) {
    return true;
  }

  if (key === "expenseCategory" && snapshot.expenseCategoryLabel) {
    return true;
  }

  if (key === "revenueCategory" && snapshot.revenueCategoryLabel) {
    return true;
  }

  if (key === "clientId" && snapshot.clientName) {
    return true;
  }

  return false;
}

function formatStaffPayrollValue(value: unknown): string {
  const parsed = parseStaffPayrollMetadata({ staffPayroll: value });

  if (parsed) {
    return buildStaffPayrollLabel(parsed);
  }

  if (isPlainObject(value)) {
    return buildStaffPayrollLabel(value as StaffPayrollMetadata);
  }

  return String(value);
}

export function buildAuditDetailEntries(
  snapshot: Record<string, unknown>
): Array<{ key: string; label: string; value: string }> {
  const entries: Array<{ key: string; label: string; value: string; order: number }> = [];
  const metadata = snapshot.metadata;

  if (isPlainObject(metadata)) {
    for (const [key, value] of Object.entries(metadata)) {
      if (key === "staffPayroll") {
        continue;
      }

      entries.push({
        key: `metadata.${key}`,
        label: getAuditDetailFieldLabel(key),
        value: formatAuditDetailValue(key, value),
        order: getFieldOrder(`metadata.${key}`),
      });
    }
  }

  const staffPayroll = snapshot.staffPayroll ?? (isPlainObject(metadata) ? metadata.staffPayroll : null);

  if (staffPayroll) {
    entries.push({
      key: "staffPayroll",
      label: getAuditDetailFieldLabel("staffPayroll"),
      value: formatStaffPayrollValue(staffPayroll),
      order: getFieldOrder("staffPayroll"),
    });
  }

  for (const [key, value] of Object.entries(snapshot)) {
    if (shouldHideAuditDetailField(key, snapshot)) {
      continue;
    }

    if (key === "label" && isPlainObject(metadata) && "label" in metadata) {
      continue;
    }

    entries.push({
      key,
      label: getAuditDetailFieldLabel(key),
      value: formatAuditDetailValue(key, value),
      order: getFieldOrder(key),
    });
  }

  return entries
    .sort((left, right) => left.order - right.order || left.label.localeCompare(right.label, "fr"))
    .map(({ key, label, value }) => ({ key, label, value }));
}

/** @deprecated Préférer formatAuditDetailValue avec la clé du champ. */
export function formatAuditValue(key: string, value: unknown): string {
  return formatAuditDetailValue(key, value);
}
