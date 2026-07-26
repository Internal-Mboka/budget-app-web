import { notFound, redirect } from "next/navigation";

import { ClientDetailPanel } from "@/components/organisms/client-detail-panel";
import { hasAnyPermission, hasPermission, requireSession } from "@/lib/auth/session";
import { computeClientStats, decimalToNumber } from "@/lib/clients/stats";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";

type ClientDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ txPage?: string; txPageSize?: string }>;
};

export default async function ClientDetailPage({ params, searchParams }: ClientDetailPageProps) {
  const session = await requireSession();

  const canViewDetail = hasAnyPermission(session.user.permissions, [
    PERMISSIONS.DASHBOARD_FULL,
    PERMISSIONS.DASHBOARD_FINANCIAL,
  ]);
  const canEditClient = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_REVENUE);

  if (!canViewDetail) {
    redirect("/clients");
  }

  const { id } = await params;
  const query = await searchParams;
  const txPagination = parsePagination({
    page: query.txPage,
    pageSize: query.txPageSize,
  });

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
      tags: true,
      createdAt: true,
    },
  });

  if (!client) {
    notFound();
  }

  const [txTotal, transactions, statsSource] = await Promise.all([
    prisma.transaction.count({ where: { clientId: id } }),
    prisma.transaction.findMany({
      where: { clientId: id },
      orderBy: { createdAt: "desc" },
      skip: txPagination.skip,
      take: txPagination.take,
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
    }),
    prisma.transaction.findMany({
      where: { clientId: id },
      select: {
        type: true,
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        status: true,
      },
    }),
  ]);

  const transactionRows = transactions.map((transaction) => ({
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
    statsSource.map((transaction) => ({
      type: transaction.type as "REVENUE" | "EXPENSE",
      totalAmount: decimalToNumber(transaction.totalAmount),
      paidAmount: decimalToNumber(transaction.paidAmount),
      remainingAmount: decimalToNumber(transaction.remainingAmount),
      status: transaction.status as
        | "DEVIS_PROFORMA"
        | "RESERVE_ACOMPTE_REQUIS"
        | "EN_COURS_REALISE"
        | "SOLDE"
        | "LITIGE_ANNULE",
    }))
  );

  const transactionsPagination = buildPaginationMeta(
    txTotal,
    txPagination.page,
    txPagination.pageSize
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
        tags: client.tags,
        createdAt: client.createdAt.toISOString(),
      }}
      transactions={transactionRows}
      transactionsPagination={transactionsPagination}
      stats={stats}
      canEditClient={canEditClient}
    />
  );
}
