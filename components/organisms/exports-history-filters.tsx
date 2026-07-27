"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import { MbokaInfoPopover } from "@/components/molecules/mboka-info-popover";
import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { GENERATED_EXPORT_KINDS, getGeneratedExportKindLabel } from "@/lib/exports/kinds";
import {
  mbokaButtonOutlineClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExportsHistoryFiltersProps = {
  from?: string;
  to?: string;
  kind?: string;
};

export function ExportsHistoryFilters({ from, to, kind }: ExportsHistoryFiltersProps) {
  const router = useRouter();

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")}
      data-testid="exports-history-filters"
    >
      <header className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Filter className="size-4 text-sky-600 dark:text-sky-400" />
          <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Affiner la liste</p>
        </div>

        <MbokaInfoPopover title="Comment lire cette page" testId="exports-history-info-popover">
          <p>
            Ici sont listés tous les fichiers déjà exportés — registres, récaps de dépenses, bilans PDF, etc. Vous
            pouvez les retélécharger à tout moment.
          </p>
          <p>
            <strong className="font-medium text-slate-700 dark:text-slate-200">Copie archivée</strong> — le fichier
            exact produit à la date indiquée. C&apos;est la référence à conserver pour un audit ou un contrôle.
          </p>
          <p>
            <strong className="font-medium text-slate-700 dark:text-slate-200">Version à jour</strong> — disponible
            seulement pour les registres CSV et récaps de dépenses : recalcule les chiffres avec les données actuelles,
            sans remplacer l&apos;archive.
          </p>
          <p>
            <strong className="font-medium text-slate-700 dark:text-slate-200">Bilans clôturés</strong> — figés à la
            clôture ; seule la copie archivée fait foi.
          </p>
        </MbokaInfoPopover>
      </header>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const params = new URLSearchParams();

          const fromValue = String(formData.get("from") ?? "");
          const toValue = String(formData.get("to") ?? "");
          const kindValue = String(formData.get("kind") ?? "all");

          if (fromValue) params.set("from", fromValue);
          if (toValue) params.set("to", toValue);
          if (kindValue !== "all") params.set("kind", kindValue);

          const query = params.toString();
          router.push(query ? `/exports/history?${query}` : "/exports/history");
        }}
      >
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="from" className={mbokaLabelClassName}>
              Du
            </FieldLabel>
            <Input id="from" name="from" type="date" defaultValue={from ?? ""} className={mbokaFieldClassName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="to" className={mbokaLabelClassName}>
              Au
            </FieldLabel>
            <Input id="to" name="to" type="date" defaultValue={to ?? ""} className={mbokaFieldClassName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="kind" className={mbokaLabelClassName}>
              Type de fichier
            </FieldLabel>
            <MbokaSelect
              id="kind"
              name="kind"
              defaultValue={kind ?? "all"}
              options={[
                { value: "all", label: "Tous les documents" },
                ...GENERATED_EXPORT_KINDS.map((entry) => ({
                  value: entry,
                  label: getGeneratedExportKindLabel(entry),
                })),
              ]}
            />
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={mbokaButtonOutlineClassName} data-testid="exports-history-apply">
            Appliquer
          </button>
          <Link href="/exports/history" className={mbokaButtonOutlineClassName}>
            Réinitialiser
          </Link>
        </div>
      </form>
    </section>
  );
}
