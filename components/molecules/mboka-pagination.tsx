"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

import { PAGE_SIZE_OPTIONS } from "@/lib/pagination";
import type { PaginationMeta } from "@/lib/pagination";
import { mbokaButtonOutlineClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type MbokaPaginationProps = {
  meta: PaginationMeta;
  buildHref: (page: number, pageSize?: number) => string;
  className?: string;
};

export function MbokaPagination({ meta, buildHref, className }: MbokaPaginationProps) {
  const { page, pageSize, total, totalPages, from, to } = meta;

  if (total === 0) {
    return null;
  }

  const prevPage = Math.max(1, page - 1);
  const nextPage = Math.min(totalPages, page + 1);
  const canGoPrev = page > 1;
  const canGoNext = page < totalPages;

  return (
    <nav
      aria-label="Pagination"
      className={cn(
        "flex flex-col gap-4 border-t border-sky-100 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-sky-900",
        className
      )}
      data-testid="mboka-pagination"
    >
      <p className="text-xs text-slate-500 dark:text-slate-400">
        Affichage {from}–{to} sur {total} élément{total > 1 ? "s" : ""}
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Par page
          </span>
          <div
            className="inline-flex rounded-2xl border border-sky-100 bg-sky-50/50 p-1 dark:border-sky-900 dark:bg-slate-900/50"
            data-testid="pagination-page-size"
            role="group"
            aria-label="Nombre d'éléments par page"
          >
            {PAGE_SIZE_OPTIONS.map((option) => {
              const isSelected = pageSize === option;

              return (
                <Link
                  key={option}
                  href={buildHref(1, option)}
                  data-testid={`pagination-page-size-${option}`}
                  aria-current={isSelected ? "page" : undefined}
                  className={cn(
                    "min-w-[2.25rem] rounded-xl px-2.5 py-1.5 text-center text-xs font-medium transition-all duration-200 no-underline",
                    isSelected
                      ? "bg-white text-[#10579F] shadow-sm ring-1 ring-sky-100 dark:bg-slate-800 dark:text-sky-100 dark:ring-sky-900"
                      : "text-slate-500 hover:text-[#10579F] dark:text-slate-400 dark:hover:text-sky-200"
                  )}
                >
                  {option}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href={buildHref(prevPage)}
            aria-disabled={!canGoPrev}
            data-testid="pagination-prev"
            className={cn(
              mbokaButtonOutlineClassName,
              "px-3 py-2 text-xs no-underline",
              !canGoPrev && "pointer-events-none opacity-40"
            )}
          >
            <ChevronLeft className="size-4" />
            Précédent
          </Link>

          <span
            className="rounded-xl bg-sky-50 px-3 py-2 text-xs font-medium text-[#10579F] dark:bg-slate-800 dark:text-sky-100"
            data-testid="pagination-current"
          >
            Page {page} / {totalPages}
          </span>

          <Link
            href={buildHref(nextPage)}
            aria-disabled={!canGoNext}
            data-testid="pagination-next"
            className={cn(
              mbokaButtonOutlineClassName,
              "px-3 py-2 text-xs no-underline",
              !canGoNext && "pointer-events-none opacity-40"
            )}
          >
            Suivant
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>
    </nav>
  );
}
