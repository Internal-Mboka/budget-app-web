import { notFound } from "next/navigation";

import { CashClosingDetailPanel } from "@/components/organisms/cash-closing-detail-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { hasPermission, requirePermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

type CashClosingDetailPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ created?: string; reviewApproved?: string; reviewResolved?: string }>;
};

export default async function CashClosingDetailPage({ params, searchParams }: CashClosingDetailPageProps) {
  const session = await requirePermission(PERMISSIONS.CASH_CLOSE);
  const { id } = await params;
  const query = await searchParams;
  const canReview = hasPermission(session.user.permissions, PERMISSIONS.CASH_APPROVE_CLOSING);

  const closing = await prisma.cashClosing.findUnique({
    where: { id },
    select: {
      id: true,
      date: true,
      theoreticalCash: true,
      theoreticalMobileMoney: true,
      openingCash: true,
      openingMobileMoney: true,
      realCash: true,
      realMobileMoney: true,
      gapAmount: true,
      hasDiscrepancy: true,
      notes: true,
      reviewStatus: true,
      reviewerInstruction: true,
      reviewedBy: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      operator: {
        select: {
          firstName: true,
          lastName: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!closing) {
    notFound();
  }

  const reviewerName = closing.reviewedBy
    ? `${closing.reviewedBy.firstName} ${closing.reviewedBy.lastName}`
    : null;

  return (
    <div className="space-y-6">
      <MbokaPageHeader
        eyebrow="Rapprochement"
        title="Fiche de clôture"
        description="Récapitulatif des comptages réels, montants théoriques et écart constaté."
      />

      <CashClosingDetailPanel
        closing={{
          id: closing.id,
          date: closing.date.toISOString(),
          theoreticalCash: decimalToNumber(closing.theoreticalCash),
          theoreticalMobileMoney: decimalToNumber(closing.theoreticalMobileMoney),
          openingCash: decimalToNumber(closing.openingCash),
          openingMobileMoney: decimalToNumber(closing.openingMobileMoney),
          realCash: decimalToNumber(closing.realCash),
          realMobileMoney: decimalToNumber(closing.realMobileMoney),
          gapAmount: decimalToNumber(closing.gapAmount),
          hasDiscrepancy: closing.hasDiscrepancy,
          notes: closing.notes,
          reviewStatus: closing.reviewStatus,
          reviewerInstruction: closing.reviewerInstruction,
          operator: closing.operator,
        }}
        canReview={canReview}
        reviewerName={reviewerName}
        flash={{
          created: query.created === "1",
          reviewApproved: query.reviewApproved === "1",
          reviewResolved: query.reviewResolved === "1",
        }}
      />
    </div>
  );
}
