import { FileDown, FileText } from "lucide-react";
import Link from "next/link";

import { mbokaButtonOutlineClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type RevenuePdfActionsProps = {
  revenueId: string;
  paidAmount: number;
  isCancelled?: boolean;
};

function buildPdfHref(revenueId: string, type: "proforma" | "receipt"): string {
  return `/api/revenues/${revenueId}/pdf?type=${type}`;
}

export function RevenuePdfActions({ revenueId, paidAmount, isCancelled = false }: RevenuePdfActionsProps) {
  const canDownloadReceipt = paidAmount > 0;

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}
      data-testid="revenue-pdf-section"
    >
      <div>
        <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Documents PDF</h3>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          Téléchargez un devis pro-forma ou un reçu d&apos;encaissement à remettre au client.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        {!isCancelled ? (
          <Link
            href={buildPdfHref(revenueId, "proforma")}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="revenue-pdf-proforma-link"
            className={cn(
              mbokaButtonOutlineClassName,
              "inline-flex items-center gap-2 no-underline"
            )}
          >
            <FileText className="size-4" />
            Devis / Pro-forma
          </Link>
        ) : null}

        {canDownloadReceipt ? (
          <Link
            href={buildPdfHref(revenueId, "receipt")}
            target="_blank"
            rel="noopener noreferrer"
            data-testid="revenue-pdf-receipt-link"
            className={cn(
              mbokaButtonOutlineClassName,
              "inline-flex items-center gap-2 no-underline"
            )}
          >
            <FileDown className="size-4" />
            Reçu d&apos;encaissement
          </Link>
        ) : (
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Le reçu sera disponible dès qu&apos;un acompte aura été enregistré.
          </p>
        )}
      </div>
    </section>
  );
}
