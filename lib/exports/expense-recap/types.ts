export const MBOKA_EXPENSE_RECAP_BRAND = {
  name: "Mboka Studio",
  product: "Mboka Budget",
  title: "Récapitulatif des dépenses",
} as const;

export type ExpenseRecapPdfRow = {
  code: string;
  dateLabel: string;
  categoryLabel: string;
  totalAmount: number;
  paidAmount: number;
  paymentMethodLabel: string;
  approvalLabel: string;
  attachmentCount: number;
};

export type ExpenseRecapPdfData = {
  from: string;
  to: string;
  periodLabel: string;
  documentCode: string;
  rows: ExpenseRecapPdfRow[];
  expenseCount: number;
  attachmentCount: number;
  totalAmount: number;
  paidTotal: number;
  issuedAt: string;
};
