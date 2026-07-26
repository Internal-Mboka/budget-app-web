import { notFound } from "next/navigation";

import { RevenueDetailPanel } from "@/components/organisms/revenue-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requireSession } from "@/lib/auth/session";
import { parseRevenueCancellation } from "@/lib/revenues/cancellation";
import { parseRevenueFulfillment } from "@/lib/revenues/fulfillment";
import { getRevenuePaymentHistoryForDisplay } from "@/lib/revenues/payment-history";
import type { RevenueMetadata } from "@/lib/revenues/metadata";
import { PERMISSIONS } from "@/lib/permissions";
import { decimalToNumber } from "@/lib/transactions/decimal";
import { prisma } from "@/lib/prisma";
import type { RevenueCategory } from "@prisma/client";

type RevenueDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ paid?: string; realized?: string; created?: string; cancelled?: string }>;
};

export default async function RevenueDetailPage({ params, searchParams }: RevenueDetailPageProps) {
  const session = await requireSession();
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

  const canCancel = hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CANCEL_ADJUSTMENT);
  const cancellation = parseRevenueCancellation(revenue.metadata);
  const paymentHistory = getRevenuePaymentHistoryForDisplay(
    revenue.metadata,
    decimalToNumber(revenue.paidAmount),
    revenue.createdAt.toISOString()
  );

  const flash = {
    created: query.created === "1",
    paid: query.paid === "solde" ? ("solde" as const) : query.paid === "partial" ? ("partial" as const) : undefined,
    realized: query.realized === "1",
    cancelled: query.cancelled === "1",
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
          cancellation,
          paymentHistory,
          createdAt: revenue.createdAt.toISOString(),
          client: revenue.client,
          canCancel,
        }}
        flash={flash}
      />
    </div>
  );
}
