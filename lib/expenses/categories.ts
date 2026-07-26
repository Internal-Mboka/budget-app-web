import type { ExpenseCategory } from "@prisma/client";

export const EXPENSE_CATEGORY_OPTIONS: Array<{ value: ExpenseCategory; label: string }> = [
  { value: "MATERIEL_EQUIPEMENT", label: "Matériel & équipement" },
  { value: "LOYER_CHARGES_FIXES", label: "Loyer & charges fixes" },
  { value: "PAIES_CACHETS_STAFF", label: "Paies & cachets staff" },
  { value: "INVESTISSEMENT", label: "Investissement" },
];

export const EXPENSE_CATEGORY_LABELS: Record<ExpenseCategory, string> = {
  MATERIEL_EQUIPEMENT: "Matériel & équipement",
  LOYER_CHARGES_FIXES: "Loyer & charges fixes",
  PAIES_CACHETS_STAFF: "Paies & cachets staff",
  INVESTISSEMENT: "Investissement",
  AVANCE_CAISSE_NOTE_FRAIS: "Avance de caisse / note de frais",
};

export function getExpenseCategoryLabel(category: ExpenseCategory | string): string {
  return EXPENSE_CATEGORY_LABELS[category as ExpenseCategory] ?? category;
}
