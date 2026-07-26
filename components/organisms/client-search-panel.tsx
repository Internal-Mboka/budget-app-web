"use client";

import { useState } from "react";

import { ClientPickerField } from "@/components/organisms/client-picker-field";
import { getClientCategoryLabel } from "@/lib/clients/categories";
import type { ClientSearchResult } from "@/lib/clients/search";
import { mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ClientSearchPanel() {
  const [selectedClient, setSelectedClient] = useState<ClientSearchResult | null>(null);

  return (
    <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="client-search-panel">
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Retrouver un client
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Saisissez un nom, un téléphone ou une catégorie pour retrouver un client. S&apos;il
          n&apos;existe pas encore, vous pouvez le créer ici sans quitter la page.
        </p>
      </div>

      <ClientPickerField
        value={selectedClient}
        onChange={setSelectedClient}
        label="Client"
      />

      {selectedClient ? (
        <p
          className="rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-[#10579F] dark:border-sky-900 dark:bg-slate-800/60 dark:text-sky-100"
          data-testid="client-picker-selection"
        >
          Client sélectionné : <strong>{selectedClient.name}</strong>
          {" · "}
          {getClientCategoryLabel(selectedClient.category)}
        </p>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="client-picker-empty">
          Aucun client sélectionné pour le moment.
        </p>
      )}
    </section>
  );
}
