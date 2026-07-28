"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Filter } from "lucide-react";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { AUDIT_ACTION_OPTIONS, getAuditEntityLabel } from "@/lib/audit/labels";
import type { AuditLogFilters } from "@/lib/audit/load-logs";
import {
  mbokaButtonOutlineClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AuditLogFiltersPanelProps = {
  filters: AuditLogFilters;
  actors: Array<{ id: string; label: string; email: string }>;
};

const ENTITY_VALUES = ["User", "Client", "Transaction", "CashClosing", "Role", "AuditLog"] as const;

const ENTITY_OPTIONS = [
  { value: "", label: "Tous les types" },
  ...ENTITY_VALUES.map((value) => ({ value, label: getAuditEntityLabel(value) })),
];

export function AuditLogFiltersPanel({ filters, actors }: AuditLogFiltersPanelProps) {
  const router = useRouter();

  return (
    <section className={cn(mbokaPanelClassName, "space-y-4 p-4 sm:p-5")} data-testid="audit-log-filters">
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

          for (const key of ["from", "to", "action", "entity", "userId"] as const) {
            const value = String(formData.get(key) ?? "").trim();

            if (value) {
              params.set(key, value);
            }
          }

          const query = params.toString();
          router.push(query ? `/audit?${query}` : "/audit");
        }}
      >
        <FieldGroup className="gap-4 sm:grid sm:grid-cols-2 lg:grid-cols-3">
          <Field>
            <FieldLabel htmlFor="from" className={mbokaLabelClassName}>
              Du
            </FieldLabel>
            <Input id="from" name="from" type="date" defaultValue={filters.from ?? ""} className={mbokaFieldClassName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="to" className={mbokaLabelClassName}>
              Au
            </FieldLabel>
            <Input id="to" name="to" type="date" defaultValue={filters.to ?? ""} className={mbokaFieldClassName} />
          </Field>
          <Field>
            <FieldLabel htmlFor="action" className={mbokaLabelClassName}>
              Type d&apos;action
            </FieldLabel>
            <MbokaSelect
              id="action"
              name="action"
              defaultValue={filters.action ?? ""}
              options={[{ value: "", label: "Toutes les actions" }, ...AUDIT_ACTION_OPTIONS]}
            />
          </Field>
          <Field>
            <FieldLabel htmlFor="entity" className={mbokaLabelClassName}>
              Type d&apos;enregistrement
            </FieldLabel>
            <MbokaSelect id="entity" name="entity" defaultValue={filters.entity ?? ""} options={ENTITY_OPTIONS} />
          </Field>
          <Field className="sm:col-span-2 lg:col-span-2">
            <FieldLabel htmlFor="userId" className={mbokaLabelClassName}>
              Auteur
            </FieldLabel>
            <MbokaSelect
              id="userId"
              name="userId"
              defaultValue={filters.userId ?? ""}
              options={[
                { value: "", label: "Tous les utilisateurs" },
                ...actors.map((actor) => ({
                  value: actor.id,
                  label: `${actor.label} (${actor.email})`,
                })),
              ]}
            />
          </Field>
        </FieldGroup>

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={mbokaButtonOutlineClassName} data-testid="audit-log-filters-apply">
            Appliquer
          </button>
          <Link href="/audit" className={mbokaButtonOutlineClassName}>
            Réinitialiser
          </Link>
        </div>
      </form>
    </section>
  );
}
