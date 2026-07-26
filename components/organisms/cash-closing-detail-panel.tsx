"use client";

import Link from "next/link";
import { useEffect } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AlertTriangle, ArrowLeft, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

import { CashClosingOperatorCard } from "@/components/molecules/cash-closing-operator-card";
import { CashClosingPdfActions } from "@/components/molecules/cash-closing-pdf-actions";
import { computeExpectedClosingBalances } from "@/lib/cash-closing/expected";
import { computeCashClosingGap } from "@/lib/cash-closing/gap";
import { formatGapDifference } from "@/lib/cash-closing/gap-labels";
import { formatMoney } from "@/lib/currency";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingDetailPanelProps = {
  closing: {
    id: string;
    date: string;
    theoreticalCash: number;
    theoreticalMobileMoney: number;
    openingCash: number;
    openingMobileMoney: number;
    realCash: number;
    realMobileMoney: number;
    gapAmount: number;
    hasDiscrepancy: boolean;
    notes?: string | null;
    operator: {
      firstName: string;
      lastName: string;
      avatarUrl: string | null;
    };
  };
  flash?: {
    created?: boolean;
  };
};

export function CashClosingDetailPanel({ closing, flash }: CashClosingDetailPanelProps) {
  useEffect(() => {
    if (flash?.created) {
      toast.success("Clôture enregistrée — imprimez le ticket Z si besoin.");
    }
  }, [flash?.created]);

  const closingDateLabel = format(new Date(closing.date), "d MMMM yyyy", { locale: fr });
  const expected = computeExpectedClosingBalances({
    openingCash: closing.openingCash,
    openingMobileMoney: closing.openingMobileMoney,
    netCash: closing.theoreticalCash,
    netMobileMoney: closing.theoreticalMobileMoney,
  });
  const gap = computeCashClosingGap({
    expectedCash: expected.expectedCash,
    expectedMobileMoney: expected.expectedMobileMoney,
    realCash: closing.realCash,
    realMobileMoney: closing.realMobileMoney,
  });

  return (
    <div className="space-y-6">
      <Link
        href="/cash-closing"
        className="inline-flex items-center gap-2 text-sm font-medium text-[#10579F] hover:underline dark:text-sky-300"
        data-testid="cash-closing-back-link"
      >
        <ArrowLeft className="size-4" />
        Retour aux clôtures
      </Link>

      <CashClosingOperatorCard
        operator={closing.operator}
        emphasized={closing.hasDiscrepancy}
        subtitle={
          closing.hasDiscrepancy
            ? "Responsable identifié — une différence a été constatée"
            : "Responsable identifié — comptages conformes au registre"
        }
      />

      <CashClosingPdfActions closingId={closing.id} />

      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="cash-closing-detail-panel">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-sky-100 px-2.5 py-1 text-xs font-medium text-sky-800 dark:bg-sky-950/40 dark:text-sky-300">
            {closingDateLabel}
          </span>
          {closing.hasDiscrepancy ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-medium text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
              data-testid="cash-closing-discrepancy-badge"
            >
              <AlertTriangle className="size-3.5" />
              Différence constatée
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
              data-testid="cash-closing-balanced-badge"
            >
              <CheckCircle2 className="size-3.5" />
              Tout correspond
            </span>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <p className={mbokaLabelClassName}>Mouvement net espèces (jour)</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.theoreticalCash)}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Mouvement net Mobile Money (jour)</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.theoreticalMobileMoney)}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Fond espèces (début)</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.openingCash)}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Fond Mobile Money (début)</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.openingMobileMoney)}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Solde espèces attendu</p>
            <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">
              {formatMoney(expected.expectedCash)}
            </p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Solde Mobile Money attendu</p>
            <p className="mt-1 text-sm font-semibold text-[#10579F] dark:text-sky-50">
              {formatMoney(expected.expectedMobileMoney)}
            </p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Espèces comptées</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.realCash)}</p>
          </div>
          <div>
            <p className={mbokaLabelClassName}>Mobile Money compté</p>
            <p className="mt-1 text-sm font-medium">{formatMoney(closing.realMobileMoney)}</p>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-100 bg-slate-50/70 px-4 py-3 dark:border-slate-800 dark:bg-slate-900/50">
          <p className={mbokaLabelClassName}>Résultat du rapprochement</p>
          <div className="mt-2 space-y-1 text-sm">
            <p>
              Espèces :{" "}
              <span
                className={cn(
                  "font-semibold",
                  gap.gapCash !== 0
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                {formatGapDifference(gap.gapCash)}
              </span>
            </p>
            <p>
              Mobile money :{" "}
              <span
                className={cn(
                  "font-semibold",
                  gap.gapMobileMoney !== 0
                    ? "text-amber-700 dark:text-amber-300"
                    : "text-emerald-700 dark:text-emerald-300"
                )}
              >
                {formatGapDifference(gap.gapMobileMoney)}
              </span>
            </p>
          </div>
          {closing.hasDiscrepancy ? (
            <p
              className="mt-3 text-sm text-amber-700 dark:text-amber-300"
              data-testid="cash-closing-detail-gap"
            >
              Différence signalée pour revue.
            </p>
          ) : (
            <p
              className="mt-3 text-sm font-semibold text-emerald-700 dark:text-emerald-300"
              data-testid="cash-closing-detail-gap"
            >
              Comptages conformes au registre.
            </p>
          )}
        </div>

        {closing.notes ? (
          <div
            className="rounded-2xl border border-amber-100 bg-amber-50/60 px-4 py-3 dark:border-amber-900 dark:bg-amber-950/20"
            data-testid="cash-closing-detail-notes"
          >
            <p className={mbokaLabelClassName}>Explication de l&apos;opérateur</p>
            <p className="mt-2 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200">
              {closing.notes}
            </p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
