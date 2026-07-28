"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { ShieldAlert } from "lucide-react";
import type { ClosingReviewStatus } from "@prisma/client";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import { Field, FieldLabel } from "@/components/ui/field";
import {
  approveCashClosingReviewFormAction,
  resolveCashClosingReviewFormAction,
  type CashClosingReviewFormState,
} from "@/lib/actions/cash-closing-review";
import {
  getClosingReviewStatusLabel,
  isClosingReviewPending,
  isClosingReviewResolved,
} from "@/lib/cash-closing/review";
import { mbokaFieldClassName, mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingReviewSectionProps = {
  closingId: string;
  reviewStatus: ClosingReviewStatus;
  reviewerInstruction?: string | null;
  reviewerName?: string | null;
  canReview: boolean;
};

export function CashClosingReviewSection({
  closingId,
  reviewStatus,
  reviewerInstruction,
  reviewerName,
  canReview,
}: CashClosingReviewSectionProps) {
  const handledApproveRef = useRef<CashClosingReviewFormState>(null);
  const handledResolveRef = useRef<CashClosingReviewFormState>(null);
  const [instruction, setInstruction] = useState("");
  const [approveState, approveAction] = useActionState(approveCashClosingReviewFormAction, null);
  const [resolveState, resolveAction] = useActionState(resolveCashClosingReviewFormAction, null);

  useEffect(() => {
    if (!approveState || approveState === handledApproveRef.current || approveState.success) {
      return;
    }

    handledApproveRef.current = approveState;
    toast.error(approveState.error);
  }, [approveState]);

  useEffect(() => {
    if (!resolveState || resolveState === handledResolveRef.current || resolveState.success) {
      return;
    }

    handledResolveRef.current = resolveState;
    toast.error(resolveState.error);
  }, [resolveState]);

  const pending = isClosingReviewPending(reviewStatus);
  const resolved = isClosingReviewResolved(reviewStatus);

  return (
    <section
      className={cn(
        mbokaPanelClassName,
        "space-y-4 p-5 sm:p-6",
        pending && "border-amber-200 dark:border-amber-900",
        resolved && "border-emerald-200 dark:border-emerald-900"
      )}
      data-testid="cash-closing-review-section"
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-2xl",
            pending && "bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300",
            !pending && "bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300"
          )}
        >
          <ShieldAlert className="size-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Revue PDG</h3>
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="cash-closing-review-status">
            {getClosingReviewStatusLabel(reviewStatus)}
            {reviewerName ? ` — ${reviewerName}` : null}
          </p>
        </div>
      </div>

      {reviewerInstruction ? (
        <div
          className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 dark:border-sky-900 dark:bg-sky-950/20"
          data-testid="cash-closing-reviewer-instruction"
        >
          <p className={mbokaLabelClassName}>Instruction de régularisation</p>
          <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
            {reviewerInstruction}
          </p>
        </div>
      ) : null}

      {pending && canReview ? (
        <div className="space-y-4">
          <Field className="gap-2">
            <FieldLabel htmlFor="reviewerInstruction" className={mbokaLabelClassName}>
              Instruction PDG (obligatoire pour régulariser)
            </FieldLabel>
            <textarea
              id="reviewerInstruction"
              name="reviewerInstruction"
              rows={3}
              value={instruction}
              onChange={(event) => setInstruction(event.target.value)}
              placeholder="Ex. écart imputé à l'opérateur, régularisation comptable le lendemain…"
              className={cn(mbokaFieldClassName, "min-h-24 resize-y")}
            />
          </Field>

          <div className="flex flex-wrap gap-3">
            <form action={approveAction} data-testid="cash-closing-review-approve-form">
              <input type="hidden" name="closingId" value={closingId} />
              <input type="hidden" name="reviewerInstruction" value={instruction} />
              <MbokaPendingFieldset>
                <MbokaSubmitButton testId="cash-closing-review-approve" pendingLabel="Validation...">
                  Valider l&apos;analyse
                </MbokaSubmitButton>
              </MbokaPendingFieldset>
            </form>

            <form action={resolveAction} data-testid="cash-closing-review-resolve-form">
              <input type="hidden" name="closingId" value={closingId} />
              <input type="hidden" name="reviewerInstruction" value={instruction} />
              <MbokaPendingFieldset>
                <MbokaSubmitButton
                  testId="cash-closing-review-resolve"
                  pendingLabel="Enregistrement..."
                  className="bg-emerald-700 hover:bg-emerald-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
                >
                  Marquer comme régularisé
                </MbokaSubmitButton>
              </MbokaPendingFieldset>
            </form>
          </div>
        </div>
      ) : null}

      {pending && !canReview ? (
        <p className="text-sm text-amber-800 dark:text-amber-200">
          Cette clôture est transmise à la direction pour analyse de l&apos;écart constaté.
        </p>
      ) : null}
    </section>
  );
}
