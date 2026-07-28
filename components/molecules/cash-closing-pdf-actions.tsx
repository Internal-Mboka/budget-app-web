import { FileDown, Printer } from "lucide-react";
import Link from "next/link";

import { mbokaButtonOutlineClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingPdfActionsProps = {
  closingId: string;
};

function buildPdfHref(closingId: string, format: "thermal" | "a4"): string {
  return `/api/cash-closing/${closingId}/pdf?format=${format}`;
}

export function CashClosingPdfActions({ closingId }: CashClosingPdfActionsProps) {
  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="cash-closing-pdf-section"
    >
      <div>
        <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Ticket Z de caisse</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Imprimez le récapitulatif à agraffer à la pochette des espèces de la journée.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href={buildPdfHref(closingId, "thermal")}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="cash-closing-pdf-thermal-link"
          className={cn(mbokaButtonOutlineClassName, "inline-flex items-center gap-2 no-underline")}
        >
          <Printer className="size-4" />
          Ticket 80 mm
        </Link>

        <Link
          href={buildPdfHref(closingId, "a4")}
          target="_blank"
          rel="noopener noreferrer"
          data-testid="cash-closing-pdf-a4-link"
          className={cn(mbokaButtonOutlineClassName, "inline-flex items-center gap-2 no-underline")}
        >
          <FileDown className="size-4" />
          Format A4
        </Link>
      </div>
    </section>
  );
}
