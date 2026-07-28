import { MbokaSkeleton } from "@/components/atoms/mboka-skeleton";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ListPageSkeletonProps = {
  rows?: number;
  testId?: string;
};

export function ListPageSkeleton({ rows = 5, testId = "list-page-skeleton" }: ListPageSkeletonProps) {
  return (
    <div className="space-y-6" data-testid={testId} aria-busy="true" aria-label="Chargement de la page">
      <div className="space-y-3">
        <MbokaSkeleton className="h-4 w-32" />
        <MbokaSkeleton className="h-9 w-full max-w-sm" />
        <MbokaSkeleton className="h-5 w-full max-w-lg" />
      </div>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")}>
        <div className="flex flex-wrap gap-3">
          <MbokaSkeleton className="h-11 w-40" />
          <MbokaSkeleton className="h-11 w-32" />
          <MbokaSkeleton className="h-11 w-28" />
        </div>
      </section>

      <section className={cn(mbokaPanelClassName, "divide-y divide-sky-100 p-2 dark:divide-sky-900")}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="flex items-center gap-4 px-3 py-4">
            <MbokaSkeleton className="size-10 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-2">
              <MbokaSkeleton className="h-4 w-2/5 max-w-xs" />
              <MbokaSkeleton className="h-3 w-3/5 max-w-sm" />
            </div>
            <MbokaSkeleton className="hidden h-9 w-24 sm:block" />
          </div>
        ))}
      </section>
    </div>
  );
}
