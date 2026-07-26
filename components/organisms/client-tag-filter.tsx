"use client";

import { ClientTagBadge } from "@/components/molecules/client-tag-badge";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientTagFilterProps = {
  availableTags: string[];
  selectedTags: string[];
  onChange: (tags: string[]) => void;
};

export function ClientTagFilter({ availableTags, selectedTags, onChange }: ClientTagFilterProps) {
  function toggleTag(tag: string) {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((item) => item !== tag));
      return;
    }

    onChange([...selectedTags, tag]);
  }

  if (availableTags.length === 0) {
    return null;
  }

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-3 p-4 sm:p-5")}
      data-testid="client-tag-filter"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <p className={mbokaLabelClassName}>Filtrer par tags</p>
          {selectedTags.length > 0 ? (
            <span className="rounded-full bg-[#10579F]/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-[#10579F] dark:bg-sky-400/15 dark:text-sky-300">
              {selectedTags.length} actif{selectedTags.length > 1 ? "s" : ""}
            </span>
          ) : null}
        </div>
        {selectedTags.length > 0 ? (
          <button
            type="button"
            className="text-xs font-medium text-sky-600 transition hover:text-[#10579F] dark:text-sky-400 dark:hover:text-sky-300"
            data-testid="client-tag-filter-clear"
            onClick={() => onChange([])}
          >
            Effacer les filtres
          </button>
        ) : null}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {selectedTags.length === 0
          ? "Sélectionnez un ou plusieurs tags — les clients doivent correspondre à tous les tags choisis."
          : "Affichage des clients possédant tous les tags sélectionnés."}
      </p>

      <div className="flex flex-wrap gap-2">
        {availableTags.map((tag) => {
          const isSelected = selectedTags.includes(tag);

          return (
            <button
              key={tag}
              type="button"
              data-testid={`client-tag-filter-${tag.toLowerCase().replace(/\s+/g, "-")}`}
              aria-pressed={isSelected}
              aria-label={`${isSelected ? "Retirer" : "Appliquer"} le filtre ${tag}`}
              onClick={() => toggleTag(tag)}
              className={cn(
                "rounded-full bg-transparent p-0 transition-transform duration-200",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#10579F]/35 focus-visible:ring-offset-2 focus-visible:ring-offset-white dark:focus-visible:ring-sky-400/40 dark:focus-visible:ring-offset-slate-950",
                isSelected && "scale-[1.02]"
              )}
            >
              <ClientTagBadge tag={tag} filterMode selected={isSelected} />
            </button>
          );
        })}
      </div>
    </section>
  );
}
