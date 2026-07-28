import { cn } from "@/lib/utils";

type MbokaSkeletonProps = {
  className?: string;
};

/** Placeholder animé aligné sur le design Mboka (SPEC 9 US-61). */
export function MbokaSkeleton({ className }: MbokaSkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-2xl bg-sky-100/90 dark:bg-slate-800/90",
        className
      )}
      aria-hidden="true"
    />
  );
}
