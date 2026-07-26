import { notFound, redirect } from "next/navigation";

import { ClientDetailPanel } from "@/components/organisms/client-detail-panel";
import { hasPermission, requireSession } from "@/lib/auth/session";
import { computeClientStats, decimalToNumber } from "@/lib/clients/stats";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ClientDetailPage({ params }: ClientDetailPageProps) {
  const session = await requireSession();

  const canViewDetail =
    hasPermission(session.user.permissions, PERMISSIONS.DASHBOARD_FULL) ||
    hasPermission(session.user.permissions, PERMISSIONS.DASHBOARD_FINANCIAL);

  if (!canViewDetail) {
    redirect("/clients");
  }

  const { id } = await params;

  const client = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
      createdAt: true,
      transactions: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          code: true,
          type: true,
          totalAmount: true,
          paidAmount: true,
          remainingAmount: true,
          status: true,
          currency: true,
          createdAt: true,
        },
      },
    },
  });

  if (!client) {
    notFound();
  }

  const transactions = client.transactions.map((transaction) => ({
    id: transaction.id,
    code: transaction.code,
    type: transaction.type,
    totalAmount: decimalToNumber(transaction.totalAmount),
    paidAmount: decimalToNumber(transaction.paidAmount),
    remainingAmount: decimalToNumber(transaction.remainingAmount),
    status: transaction.status,
    currency: transaction.currency,
    createdAt: transaction.createdAt.toISOString(),
  }));

  const stats = computeClientStats(
    transactions.map((transaction) => ({
      type: transaction.type as "REVENUE" | "EXPENSE",
      totalAmount: transaction.totalAmount,
      paidAmount: transaction.paidAmount,
      remainingAmount: transaction.remainingAmount,
      status: transaction.status as
        | "DEVIS_PROFORMA"
        | "RESERVE_ACOMPTE_REQUIS"
        | "EN_COURS_REALISE"
        | "SOLDE"
        | "LITIGE_ANNULE",
    }))
  );

  return (
    <ClientDetailPanel
      client={{
        id: client.id,
        name: client.name,
        category: client.category,
        phone: client.phone,
        email: client.email,
        address: client.address,
        notes: client.notes,
        createdAt: client.createdAt.toISOString(),
      }}
      transactions={transactions}
      stats={stats}
    />
  );
}
