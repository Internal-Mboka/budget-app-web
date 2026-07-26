"use client";

import Link from "next/link";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Banknote, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { formatMoney } from "@/lib/currency";
import {
  getCashAdvanceWorkflowLabel,
  type CashAdvanceWorkflowStatus,
} from "@/lib/expenses/cash-advance";
import type { CashAdvanceRequestItem } from "@/lib/expenses/load-cash-advances";
import {
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { getPaymentMethodLabel } from "@/lib/transactions/payment-methods";
import { cn } from "@/lib/utils";

type ExpensesCashAdvanceManagementProps = {
  requests: CashAdvanceRequestItem[];
  pendingApprovals: number;
  awaitingJustification: number;
  flashCreated?: boolean;
};

function workflowBadgeClass(status: CashAdvanceWorkflowStatus): string {
  switch (status) {
    case "SUBMITTED":
      return "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300";
    case "APPROVED":
      return "bg-sky-100 text-sky-800 dark:bg-sky-950/40 dark:text-sky-300";
    case "DISBURSED":
      return "bg-violet-100 text-violet-800 dark:bg-violet-950/40 dark:text-violet-300";
    case "JUSTIFIED":
      return "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "REJECTED":
      return "bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300";
  }
}

function CreatedDateLabel({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return <span suppressHydrationWarning>{label || isoDate}</span>;
}

export function ExpensesCashAdvanceManagement({
  requests,
  pendingApprovals,
  awaitingJustification,
  flashCreated,
}: ExpensesCashAdvanceManagementProps) {
  useEffect(() => {
    if (flashCreated) {
      toast.success("Demande d'avance enregistrée.");
    }
  }, [flashCreated]);

  useEffect(() => {
    if (pendingApprovals > 0) {
      toast.message(
        `${pendingApprovals} avance${pendingApprovals > 1 ? "s" : ""} en attente d'approbation.`,
        { id: "cash-advance-approval-reminder" }
      );
    }
  }, [pendingApprovals]);

  useEffect(() => {
    if (awaitingJustification > 0) {
      toast.message(
        `${awaitingJustification} avance${awaitingJustification > 1 ? "s" : ""} à justifier (reçu manquant).`,
        { id: "cash-advance-justify-reminder" }
      );
    }
  }, [awaitingJustification]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Workflow : Soumis → Approuvé → Décaissé → Justifié (reçu joint).
        </p>
        <Link
          href="/expenses/advances/new"
          className={cn(mbokaButtonPrimaryClassName, "inline-flex items-center gap-2 px-4 py-2 text-sm")}
          data-testid="expense-cash-advance-new-link"
        >
          <Plus className="size-4" />
          Nouvelle demande
        </Link>
      </div>

      <section
        className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
        data-testid="expense-cash-advance-list-section"
      >
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-700 dark:bg-sky-950/30 dark:text-sky-300">
            <Banknote className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Demandes d&apos;avance de caisse
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Notes de frais et avances urgentes soumises à validation avant sortie de trésorerie.
            </p>
          </div>
        </div>

        {requests.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-cash-advance-list-empty">
            Aucune demande enregistrée.
          </p>
        ) : (
          <div className="space-y-3" data-testid="expense-cash-advance-list">
            {requests.map((request) => (
              <article
                key={request.id}
                data-testid={`expense-cash-advance-${request.code}`}
                className="rounded-2xl border border-slate-100 bg-white/80 px-3 py-3 dark:border-slate-800 dark:bg-slate-900/50 sm:px-4"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        href={`/expenses/${request.id}`}
                        className="text-sm font-semibold text-[#10579F] hover:underline dark:text-sky-50"
                      >
                        {request.code}
                      </Link>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[11px] font-medium",
                          workflowBadgeClass(request.workflowStatus)
                        )}
                      >
                        {getCashAdvanceWorkflowLabel(request.workflowStatus)}
                      </span>
                    </div>
                    <p className="text-sm text-slate-700 dark:text-slate-200">{request.purpose}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      <CreatedDateLabel isoDate={request.createdAt} /> ·{" "}
                      {getPaymentMethodLabel(request.paymentMethod)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                    {formatMoney(request.totalAmount, {
                      symbol: request.currency === "CDF" ? "FC " : "$",
                    })}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
