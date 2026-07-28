import { Suspense } from "react";

import { RevenuesManagement } from "@/components/organisms/revenues-management";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { RevenuesCreatedToast } from "@/components/molecules/revenues-created-toast";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import { decimalToNumber } from "@/lib/transactions/decimal";
import type { RevenueCategory } from "@prisma/client";

type RevenuesPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string }>;
};

export default async function RevenuesPage({ searchParams }: RevenuesPageProps) {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);
  const params = await searchParams;
  const paginationParams = parsePagination(params);

  const where = { type: "REVENUE" as const };

  const [total, revenues] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: paginationParams.skip,
      take: paginationParams.take,
      select: {
        id: true,
        code: true,
        revenueCategory: true,
        totalAmount: true,
        paidAmount: true,
        remainingAmount: true,
        currency: true,
        status: true,
        metadata: true,
        createdAt: true,
        client: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    }),
  ]);

  const revenueRows = revenues.map((revenue) => ({
    id: revenue.id,
    code: revenue.code,
    revenueCategory: revenue.revenueCategory as RevenueCategory,
    totalAmount: decimalToNumber(revenue.totalAmount),
    paidAmount: decimalToNumber(revenue.paidAmount),
    remainingAmount: decimalToNumber(revenue.remainingAmount),
    currency: revenue.currency,
    status: revenue.status,
    metadata: revenue.metadata as RevenueMetadata | null,
    createdAt: revenue.createdAt.toISOString(),
    client: revenue.client,
  }));

  const paginationMeta = buildPaginationMeta(total, paginationParams.page, paginationParams.pageSize);

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <RevenuesCreatedToast />
      </Suspense>

      <MbokaPageHeader
        eyebrow="Opérations financières"
        title="Registre des revenus"
        description="Sessions studio, mix/master, locations véhicules et ventes annexes."
      />

      <RevenuesManagement initialRevenues={revenueRows} pagination={paginationMeta} />
    </div>
  );
}
