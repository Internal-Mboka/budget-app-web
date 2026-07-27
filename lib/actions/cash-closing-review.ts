"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";
import {
  approveCashClosingReviewSchema,
  resolveCashClosingReviewSchema,
} from "@/lib/validations/cash-closing-review";

export type CashClosingReviewActionResult =
  | { success: true }
  | { success: false; error: string };

export type CashClosingReviewFormState = CashClosingReviewActionResult | null;

function formatZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Données invalides.";
}

async function assertCanReviewCashClosing(): Promise<
  { ok: true; userId: string; email: string } | { ok: false; error: string }
> {
  const session = await getSession();

  if (!session?.user) {
    return { ok: false, error: "Session expirée. Reconnectez-vous." };
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.CASH_APPROVE_CLOSING)) {
    return { ok: false, error: "Permission insuffisante pour valider une clôture à écart." };
  }

  return { ok: true, userId: session.user.id, email: session.user.email ?? "" };
}

export async function approveCashClosingReviewFormAction(
  _prevState: CashClosingReviewFormState,
  formData: FormData
): Promise<CashClosingReviewFormState> {
  const parsed = approveCashClosingReviewSchema.safeParse({
    closingId: formData.get("closingId"),
    reviewerInstruction: formData.get("reviewerInstruction") ?? undefined,
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const result = await approveCashClosingReviewAction(parsed.data);

  if (result.success) {
    redirect(`/cash-closing/${parsed.data.closingId}?reviewApproved=1`);
  }

  return result;
}

export async function resolveCashClosingReviewFormAction(
  _prevState: CashClosingReviewFormState,
  formData: FormData
): Promise<CashClosingReviewFormState> {
  const parsed = resolveCashClosingReviewSchema.safeParse({
    closingId: formData.get("closingId"),
    reviewerInstruction: formData.get("reviewerInstruction"),
  });

  if (!parsed.success) {
    return { success: false, error: formatZodError(parsed.error) };
  }

  const result = await resolveCashClosingReviewAction(parsed.data);

  if (result.success) {
    redirect(`/cash-closing/${parsed.data.closingId}?reviewResolved=1`);
  }

  return result;
}

export async function approveCashClosingReviewAction(input: {
  closingId: string;
  reviewerInstruction?: string;
}): Promise<CashClosingReviewActionResult> {
  const auth = await assertCanReviewCashClosing();

  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const closing = await prisma.cashClosing.findUnique({
      where: { id: input.closingId },
      select: {
        id: true,
        hasDiscrepancy: true,
        reviewStatus: true,
        gapAmount: true,
      },
    });

    if (!closing) {
      return { success: false, error: "Clôture introuvable." };
    }

    if (!closing.hasDiscrepancy) {
      return { success: false, error: "Cette clôture ne nécessite pas de revue PDG." };
    }

    if (closing.reviewStatus !== "PENDING_REVIEW") {
      return { success: false, error: "Cette clôture n'est plus en attente de revue." };
    }

    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.cashClosing.update({
        where: { id: closing.id },
        data: {
          reviewStatus: "APPROVED",
          reviewerInstruction: input.reviewerInstruction ?? null,
          reviewedById: auth.userId,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "CASH_CLOSING_REVIEW_APPROVED",
        entity: "CashClosing",
        entityId: closing.id,
        userId: auth.userId,
        details: {
          gapAmount: decimalToNumber(closing.gapAmount),
          reviewerInstruction: input.reviewerInstruction ?? null,
          performedBy: auth.email,
        },
      });
    });

    revalidatePath("/cash-closing");
    revalidatePath("/cash-closing/approvals");
    revalidatePath("/cash-closing/history");
    revalidatePath(`/cash-closing/${closing.id}`);
    revalidatePath("/dashboard/financier");

    return { success: true };
  } catch (error) {
    console.error("approveCashClosingReviewAction failed", error);
    return { success: false, error: "Impossible de valider cette clôture." };
  }
}

export async function resolveCashClosingReviewAction(input: {
  closingId: string;
  reviewerInstruction: string;
}): Promise<CashClosingReviewActionResult> {
  const auth = await assertCanReviewCashClosing();

  if (!auth.ok) {
    return { success: false, error: auth.error };
  }

  try {
    const closing = await prisma.cashClosing.findUnique({
      where: { id: input.closingId },
      select: {
        id: true,
        hasDiscrepancy: true,
        reviewStatus: true,
        gapAmount: true,
      },
    });

    if (!closing) {
      return { success: false, error: "Clôture introuvable." };
    }

    if (!closing.hasDiscrepancy) {
      return { success: false, error: "Cette clôture ne nécessite pas de revue PDG." };
    }

    if (closing.reviewStatus !== "PENDING_REVIEW") {
      return { success: false, error: "Cette clôture n'est plus en attente de revue." };
    }

    const auditMeta = await captureAuditRequestContext();

    await prisma.$transaction(async (tx) => {
      await tx.cashClosing.update({
        where: { id: closing.id },
        data: {
          reviewStatus: "RESOLVED",
          reviewerInstruction: input.reviewerInstruction,
          reviewedById: auth.userId,
        },
      });

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
        action: "CASH_CLOSING_REVIEW_RESOLVED",
        entity: "CashClosing",
        entityId: closing.id,
        userId: auth.userId,
        details: {
          gapAmount: decimalToNumber(closing.gapAmount),
          reviewerInstruction: input.reviewerInstruction,
          performedBy: auth.email,
        },
      });
    });

    revalidatePath("/cash-closing");
    revalidatePath("/cash-closing/approvals");
    revalidatePath("/cash-closing/history");
    revalidatePath(`/cash-closing/${closing.id}`);
    revalidatePath("/dashboard/financier");

    return { success: true };
  } catch (error) {
    console.error("resolveCashClosingReviewAction failed", error);
    return { success: false, error: "Impossible de marquer cette clôture comme régularisée." };
  }
}
