export const MBOKA_BALANCE_BRAND = {
  name: "Mboka Studio",
  product: "Mboka Budget",
  title: "Bilan périodique",
} as const;

export type PeriodBalancePdfData = {
  periodKey: string;
  from: string;
  to: string;
  periodLabel: string;
  documentCode: string;
  revenueTotal: number;
  expenseTotal: number;
  creditTotal: number;
  netBalance: number;
  paidRevenueTotal: number;
  paidExpenseTotal: number;
  netCashFlow: number;
  revenueCount: number;
  expenseCount: number;
  creditCount: number;
  integrityHash: string;
  integrityHashDisplay: string;
  issuedAt: string;
  closedAt?: string;
  closedByName?: string;
  isPreview: boolean;
};
