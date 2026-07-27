import Papa from "papaparse";

import { getClientAccountStatus } from "@/lib/clients/account-status";
import { getClientCategoryLabel } from "@/lib/clients/categories";
import { computeClientStats, decimalToNumber } from "@/lib/clients/stats";
import { prisma } from "@/lib/prisma";

export const CLIENT_EXPORT_HEADERS = [
  "Nom",
  "Catégorie",
  "Téléphone",
  "Email",
  "Adresse",
  "Notes",
  "Statut compte",
  "Chiffre d'affaires cumulé",
  "Solde restant dû",
  "Nombre de revenus et dépenses",
] as const;

export async function buildClientsExportRows() {
  const clients = await prisma.client.findMany({
    orderBy: [{ name: "asc" }],
    select: {
      name: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      transactions: {
        select: {
          type: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
        },
      },
    },
  });

  return clients.map((client) => {
    const stats = computeClientStats(
      client.transactions.map((transaction) => ({
        type: transaction.type,
        paidAmount: decimalToNumber(transaction.paidAmount),
        remainingAmount: decimalToNumber(transaction.remainingAmount),
        status: transaction.status,
      }))
    );

    return {
      Nom: client.name,
      Catégorie: getClientCategoryLabel(client.category),
      Téléphone: client.phone ?? "",
      Email: client.email ?? "",
      Adresse: client.address ?? "",
      Notes: client.notes ?? "",
      "Statut compte": getClientAccountStatus(stats),
      "Chiffre d'affaires cumulé": stats.totalSpent.toFixed(2),
      "Solde restant dû": stats.balanceDue.toFixed(2),
      "Nombre de revenus et dépenses": String(stats.transactionCount),
    };
  });
}

export async function buildClientsExportCsv() {
  const rows = await buildClientsExportRows();
  const csv = Papa.unparse(rows, {
    columns: [...CLIENT_EXPORT_HEADERS],
    delimiter: ";",
  });

  return `\uFEFF${csv}`;
}
