"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { CheckCircle2, Lock, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  approveFiscalPeriodClosingFormAction,
  visaFiscalPeriodClosingFormAction,
  type FiscalPeriodClosingFormState,
} from "@/lib/actions/fiscal-period-closing";
import { isPdgSoloFiscalClosingEnabled } from "@/lib/fiscal-period/closing-config";
import {
  canApproveFiscalPeriodClosingAsPdg,
  canViewFiscalPeriodClosingPage,
  canVisaFiscalPeriodClosingAsAccountant,
  getFiscalPeriodClosingWorkflowLabel,
} from "@/lib/fiscal-period/closing-workflow";
import { formatFiscalPeriodRange } from "@/lib/fiscal-period/format";
import type { FiscalPeriodClosingQueueItem } from "@/lib/fiscal-period/load-closing-queue";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import type { RoleName } from "@/lib/permissions";
import { cn } from "@/lib/utils";

type FiscalPeriodClosingPanelProps = {
  items: FiscalPeriodClosingQueueItem[];
  totalPending: number;
  roleName: RoleName;
  successMessage?: string;
};

function WorkflowBadge({ step }: { step: FiscalPeriodClosingQueueItem["workflowStep"] }) {
  const label = getFiscalPeriodClosingWorkflowLabel(step);

  if (step === "approved") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
        <CheckCircle2 className="size-3.5" />
        {label}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <Lock className="size-3.5" />
      {label}
    </span>
  );
}

function ClosingActionForm({
  periodId,
  action,
  label,
  pendingLabel,
  testId,
  className,
}: {
  periodId: string;
  action: typeof visaFiscalPeriodClosingFormAction;
  label: string;
  pendingLabel: string;
  testId: string;
  className?: string;
}) {
  const handledRef = useRef<FiscalPeriodClosingFormState>(null);
  const [state, formAction] = useActionState(action, null);

  useEffect(() => {
    if (!state || state === handledRef.current || state.success) {
      return;
    }

    handledRef.current = state;
    toast.error(state.error);
  }, [state]);

  return (
    <form action={formAction}>
      <input type="hidden" name="periodId" value={periodId} />
      <MbokaPendingFieldset>
        <MbokaSubmitButton testId={testId} pendingLabel={pendingLabel} className={className}>
          {label}
        </MbokaSubmitButton>
      </MbokaPendingFieldset>
    </form>
  );
}

export function FiscalPeriodClosingPanel({
  items,
  totalPending,
  roleName,
  successMessage,
}: FiscalPeriodClosingPanelProps) {
  const pdgSolo = isPdgSoloFiscalClosingEnabled();
  const canVisa = canVisaFiscalPeriodClosingAsAccountant(roleName);
  const canValidatePdg = canApproveFiscalPeriodClosingAsPdg(roleName);
  const canView = canViewFiscalPeriodClosingPage(roleName);
  const isReadOnlyViewer = canView && !canVisa && !canValidatePdg;

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="fiscal-period-closing-panel"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
          <ShieldCheck className="size-5" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
            File de clôture trimestrielle
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {totalPending > 0
              ? `${totalPending} trimestre${totalPending > 1 ? "s" : ""} en attente de validation.`
              : "Aucun trimestre en clôture pour le moment."}
            {pdgSolo ? " Mode PDG seul activé (visa comptable optionnel)." : " Double validation : Comptable puis PDG."}
          </p>
        </div>
      </div>

      {successMessage ? (
        <p
          className="rounded-2xl border border-emerald-100 bg-emerald-50/80 px-3 py-2 text-sm text-emerald-800 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-200"
          data-testid="fiscal-period-closing-success"
          role="status"
        >
          {successMessage}
        </p>
      ) : null}

      {items.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="fiscal-period-closing-empty">
          Aucune clôture trimestrielle en cours.
        </p>
      ) : (
        <div className="space-y-3" data-testid="fiscal-period-closing-list">
          {items.map((item) => {
            const rangeLabel = formatFiscalPeriodRange(item.startDate, item.endDate);
            const endLabel = format(parseISO(item.endDate), "d MMMM yyyy", { locale: fr });

            return (
              <article
                key={item.id}
                data-testid={`fiscal-period-closing-row-${item.label}`}
                className="space-y-3 rounded-2xl border border-amber-100 bg-white/80 p-4 dark:border-amber-900 dark:bg-slate-900/50"
              >
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-semibold text-[#10579F] dark:text-sky-50">{item.label}</p>
                      <WorkflowBadge step={item.workflowStep} />
                    </div>
                    <p className="text-sm text-slate-600 dark:text-slate-300">{rangeLabel}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Échéance : {endLabel}
                    </p>
                  </div>
                </div>

                <dl className="grid gap-2 text-sm sm:grid-cols-2">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Visa comptable</dt>
                    <dd className="text-slate-700 dark:text-slate-200">
                      {item.validatedByAccountantName ?? (pdgSolo ? "Non requis (PDG seul)" : "En attente")}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-slate-400">Validation PDG</dt>
                    <dd className="text-slate-700 dark:text-slate-200">
                      {item.validatedByPdgName ?? "En attente"}
                    </dd>
                  </div>
                </dl>

                {item.workflowStep === "approved" ? (
                  <p className="text-sm text-emerald-700 dark:text-emerald-300">
                    Clôture validée — finalisation et ouverture du trimestre suivant en cours.
                  </p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {canVisa && item.workflowStep === "pending_accountant" ? (
                      <ClosingActionForm
                        periodId={item.id}
                        action={visaFiscalPeriodClosingFormAction}
                        label="Accorder le visa comptable"
                        pendingLabel="Enregistrement…"
                        testId={`fiscal-period-closing-visa-${item.label}`}
                        className={mbokaButtonPrimaryClassName}
                      />
                    ) : null}

                    {canValidatePdg && item.workflowStep === "pending_pdg" ? (
                      <ClosingActionForm
                        periodId={item.id}
                        action={approveFiscalPeriodClosingFormAction}
                        label="Valider la clôture trimestrielle"
                        pendingLabel="Validation…"
                        testId={`fiscal-period-closing-approve-${item.label}`}
                        className={mbokaButtonPrimaryClassName}
                      />
                    ) : null}

                    {isReadOnlyViewer && item.workflowStep === "pending_accountant" ? (
                      <p className="text-sm text-slate-600 dark:text-slate-300">
                        En attente du visa comptable.
                      </p>
                    ) : null}

                    {isReadOnlyViewer && item.workflowStep === "pending_pdg" ? (
                      <p
                        className="text-sm text-slate-600 dark:text-slate-300"
                        data-testid="fiscal-period-closing-readonly-notice"
                      >
                        Validation réservée au PDG pour des raisons de sécurité financière.
                      </p>
                    ) : null}

                    {!canVisa && !canValidatePdg && !isReadOnlyViewer ? (
                      <Link href="/dashboard" className={cn(mbokaButtonOutlineClassName, "no-underline")}>
                        Retour au tableau de bord
                      </Link>
                    ) : null}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
