"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { mbokaButtonOutlineClassName, mbokaFieldClassName, mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type CashClosingsHistoryFiltersProps = {
  from?: string;
  to?: string;
  discrepancy: "all" | "yes" | "no";
};

export function CashClosingsHistoryFilters({
  from,
  to,
  discrepancy,
}: CashClosingsHistoryFiltersProps) {
  const router = useRouter();

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")}
      data-testid="cash-closings-history-filters"
    >
      <div className="flex items-center gap-2">
        <Filter className="size-4 text-sky-600 dark:text-sky-400" />
        <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Filtres</p>
      </div>

      <form
        className="space-y-4"
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          const params = new URLSearchParams();

          const fromValue = String(formData.get("from") ?? "");
          const toValue = String(formData.get("to") ?? "");
          const discrepancyValue = String(formData.get("discrepancy") ?? "all");

          if (fromValue) params.set("from", fromValue);
          if (toValue) params.set("to", toValue);
          if (discrepancyValue !== "all") params.set("discrepancy", discrepancyValue);

          const query = params.toString();
          router.push(query ? `/cash-closing/history?${query}` : "/cash-closing/history");
        }}
      >
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="from" className={mbokaLabelClassName}>
              Du
            </FieldLabel>
            <Input
              id="from"
              name="from"
              type="date"
              defaultValue={from ?? ""}
              className={mbokaFieldClassName}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="to" className={mbokaLabelClassName}>
              Au
            </FieldLabel>
            <Input id="to" name="to" type="date" defaultValue={to ?? ""} className={mbokaFieldClassName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="discrepancy" className={mbokaLabelClassName}>
              Afficher
            </FieldLabel>
            <MbokaSelect
              id="discrepancy"
              name="discrepancy"
              defaultValue={discrepancy}
              options={[
                { value: "all", label: "Toutes les clôtures" },
                { value: "yes", label: "Avec différence" },
                { value: "no", label: "Conformes" },
              ]}
            />
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={mbokaButtonOutlineClassName} data-testid="cash-closings-history-apply">
            Appliquer
          </button>
          <Link href="/cash-closing/history" className={mbokaButtonOutlineClassName}>
            Réinitialiser
          </Link>
        </div>
      </form>
    </section>
  );
}
