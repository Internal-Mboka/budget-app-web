import { notFound } from "next/navigation";

import { RevenueDetailPanel } from "@/components/organisms/revenue-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { parseRevenueFulfillment } from "@/lib/revenues/fulfillment";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";
import type { RevenueCategory } from "@prisma/client";

type RevenueDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; realized?: string; created?: string }>;
};

export default async function RevenueDetailPage({ params, searchParams }: RevenueDetailPageProps) {
  const { id } = await params;
  const query = await searchParams;

  const revenue = await prisma.transaction.findFirst({
    where: { id, type: "REVENUE" },
    select: {
      id: true,
      code: true,
      revenueCategory: true,
      totalAmount: true,
      paidAmount: true,
      remainingAmount: true,
      currency: true,
      status: true,
      paymentMethod: true,
      metadata: true,
      createdAt: true,
      client: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });

  if (!revenue || !revenue.revenueCategory) {
    notFound();
  }

  const flash = {
    created: query.created === "1",
    paid: query.paid === "solde" ? ("solde" as const) : query.paid === "partial" ? ("partial" as const) : undefined,
    realized: query.realized === "1",
  };

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Opérations financières"
        title={revenue.code}
        description="Échéancier de paiement et suivi opérationnel de la prestation."
      />

      <RevenueDetailPanel
        revenue={{
          id: revenue.id,
          code: revenue.code,
          revenueCategory: revenue.revenueCategory as RevenueCategory,
          totalAmount: decimalToNumber(revenue.totalAmount),
          paidAmount: decimalToNumber(revenue.paidAmount),
          remainingAmount: decimalToNumber(revenue.remainingAmount),
          currency: revenue.currency,
          status: revenue.status,
          paymentMethod: revenue.paymentMethod,
          metadata: revenue.metadata as RevenueMetadata | null,
          fulfillment: parseRevenueFulfillment(revenue.metadata),
          createdAt: revenue.createdAt.toISOString(),
          client: revenue.client,
        }}
        flash={flash}
      />
    </div>
  );
}
