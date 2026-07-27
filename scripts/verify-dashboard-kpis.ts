/**
 * Vérifie les KPI dashboard contre la base Prisma.
 * Usage: npx tsx scripts/verify-dashboard-kpis.ts
 */
import { endOfDay, startOfMonth } from "date-fns";

import { loadDashboardKpis } from "@/lib/dashboard/load-analytics";
import { prisma } from "@/lib/prisma";

const reference = new Date();

async function main() {
  const from = startOfMonth(reference);
  const to = endOfDay(reference);
  const kpis = await loadDashboardKpis("month", reference);

  console.log("=== KPIs dashboard (même code que /dashboard) ===");
  console.log(kpis);
  console.log(`Période mois en cours: ${from.toISOString()} → ${to.toISOString()}\n`);

  const revenues = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      createdAt: { gte: from, lte: to },
    },
    select: {
      code: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      status: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const expenses = await prisma.transaction.findMany({
    where: {
      type: "EXPENSE",
      isAdjustment: false,
      approvalStatus: { not: "REJECTED" },
      createdAt: { gte: from, lte: to },
    },
    select: { code: true, totalAmount: true, paidAmount: true, approvalStatus: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const receivables = await prisma.transaction.findMany({
    where: {
      type: "REVENUE",
      isAdjustment: false,
      status: { not: "LITIGE_ANNULE" },
      remainingAmount: { gt: 0 },
    },
    select: { code: true, remainingAmount: true, totalAmount: true, status: true },
  });

  const paidRev = await prisma.transaction.aggregate({
    where: { type: "REVENUE", isAdjustment: false, status: { not: "LITIGE_ANNULE" } },
    _sum: { paidAmount: true },
  });

  const paidExp = await prisma.transaction.aggregate({
    where: { type: "EXPENSE", isAdjustment: false, approvalStatus: { not: "REJECTED" } },
    _sum: { paidAmount: true },
  });

  const fmt = (n: number) => `$${n.toFixed(2)}`;

  console.log("--- Revenus inclus dans CA (mois en cours) ---");
  for (const row of revenues) {
    console.log(
      `${row.code} | total ${fmt(Number(row.totalAmount))} | payé ${fmt(Number(row.paidAmount))} | reste ${fmt(Number(row.remainingAmount))} | ${row.status}`
    );
  }
  console.log(`→ Somme totalAmount: ${fmt(revenues.reduce((s, r) => s + Number(r.totalAmount), 0))}\n`);

  console.log("--- Dépenses incluses (mois en cours) ---");
  for (const row of expenses) {
    console.log(`${row.code} | total ${fmt(Number(row.totalAmount))} | payé ${fmt(Number(row.paidAmount))} | ${row.approvalStatus}`);
  }
  console.log(`→ Somme totalAmount: ${fmt(expenses.reduce((s, r) => s + Number(r.totalAmount), 0))}\n`);

  console.log("--- Créances (remainingAmount > 0, toutes périodes) ---");
  for (const row of receivables) {
    console.log(`${row.code} | reste ${fmt(Number(row.remainingAmount))} | total ${fmt(Number(row.totalAmount))}`);
  }
  console.log(`→ Somme remainingAmount: ${fmt(receivables.reduce((s, r) => s + Number(r.remainingAmount), 0))}\n`);

  const treasury =
    Number(paidRev._sum.paidAmount ?? 0) - Number(paidExp._sum.paidAmount ?? 0);
  console.log("--- Trésorerie nette (global, toutes périodes) ---");
  console.log(`Encaissements (Σ paidAmount revenus): ${fmt(Number(paidRev._sum.paidAmount ?? 0))}`);
  console.log(`Décaissements (Σ paidAmount dépenses): ${fmt(Number(paidExp._sum.paidAmount ?? 0))}`);
  console.log(`→ Net: ${fmt(treasury)}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
