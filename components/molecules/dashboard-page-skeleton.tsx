import { MbokaSkeleton } from "@/components/atoms/mboka-skeleton";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function DashboardPageSkeleton() {
  return (
    <div className="space-y-8" data-testid="dashboard-page-skeleton" aria-busy="true" aria-label="Chargement du dashboard">
      <div className="space-y-3">
        <MbokaSkeleton className="h-4 w-28" />
        <MbokaSkeleton className="h-9 w-full max-w-md" />
        <MbokaSkeleton className="h-5 w-full max-w-xl" />
      </div>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <MbokaSkeleton className="h-5 w-48" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <MbokaSkeleton key={index} className="h-28" />
          ))}
        </div>
        <MbokaSkeleton className="h-72 w-full" />
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <MbokaSkeleton className="h-5 w-56" />
        <MbokaSkeleton className="h-64 w-full" />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
          <MbokaSkeleton className="h-5 w-40" />
          <MbokaSkeleton className="h-56 w-full" />
        </section>
        <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
          <MbokaSkeleton className="h-5 w-44" />
          <MbokaSkeleton className="h-56 w-full" />
        </section>
      </div>
    </div>
  );
}
