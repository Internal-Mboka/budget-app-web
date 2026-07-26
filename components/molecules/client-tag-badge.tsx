import { Check } from "lucide-react";

import { getClientTagClassName } from "@/lib/clients/tags";
import { cn } from "@/lib/utils";

type ClientTagBadgeProps = {
  tag: string;
  onRemove?: () => void;
  className?: string;
  /** Mode filtre : atténue l’état repos, accentue l’état sélectionné */
  filterMode?: boolean;
  selected?: boolean;
};

export function ClientTagBadge({
  tag,
  onRemove,
  className,
  filterMode = false,
  selected = false,
}: ClientTagBadgeProps) {
  return (
    <span
      data-testid={`client-tag-${tag.toLowerCase().replace(/\s+/g, "-")}`}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition-all duration-200",
        getClientTagClassName(tag),
        filterMode &&
          !selected &&
          "opacity-60 saturate-[0.85] hover:opacity-100 hover:saturate-100 hover:shadow-sm",
        filterMode &&
          selected &&
          "gap-1.5 px-3 py-1 font-semibold shadow-sm ring-1 ring-inset ring-black/10 dark:ring-white/15",
        className
      )}
    >
      {filterMode && selected ? <Check className="size-3 shrink-0 stroke-[2.5]" aria-hidden /> : null}
      {tag}
      {onRemove ? (
        <button
          type="button"
          aria-label={`Retirer le tag ${tag}`}
          data-testid={`client-tag-remove-${tag.toLowerCase().replace(/\s+/g, "-")}`}
          className="rounded-full px-0.5 transition hover:bg-black/10 dark:hover:bg-white/10"
          onClick={onRemove}
        >
          ×
        </button>
      ) : null}
    </span>
  );
}
