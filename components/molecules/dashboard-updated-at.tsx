import { format } from "date-fns";
import { fr } from "date-fns/locale";

export function DashboardUpdatedAt() {
  const updatedLabel = format(new Date(), "d MMMM yyyy · HH:mm", { locale: fr });

  return (
    <span className="text-xs text-slate-500 dark:text-slate-400" data-testid="dashboard-updated-at">
      Données calculées au {updatedLabel}
    </span>
  );
}
