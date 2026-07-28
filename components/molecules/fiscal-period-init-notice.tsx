import { CheckCircle2 } from "lucide-react";

type FiscalPeriodInitializedBannerProps = {
  periodLabel?: string;
};

export function FiscalPeriodInitializedBanner({ periodLabel }: FiscalPeriodInitializedBannerProps) {
  return (
    <div
      className="mb-6 flex items-start gap-2.5 rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-sm text-emerald-950 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-100"
      data-testid="fiscal-period-initialized-banner"
      role="status"
    >
      <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
      <p>
        Trimestre comptable{" "}
        {periodLabel ? <span className="font-semibold">{periodLabel}</span> : "T1"} ouvert avec succès.
        Les saisies financières sont à nouveau disponibles.
      </p>
    </div>
  );
}
