"use client";

import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { ArrowLeft, Receipt } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useEffect } from "react";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { MbokaPagination } from "@/components/molecules/mboka-pagination";
import { ClientEditForm, type ClientEditData } from "@/components/organisms/client-edit-form";
import { ClientTagsEditor } from "@/components/organisms/client-tags-editor";
import { ClientTagBadge } from "@/components/molecules/client-tag-badge";
import { getClientCategoryLabel } from "@/lib/clients/categories";
import { buildClientDetailHref } from "@/lib/clients/detail-url";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { formatMoney } from "@/lib/currency";
import type { PaginationMeta } from "@/lib/pagination";
import {
  getPaymentStatusLabel,
  PAYMENT_STATUS_FILTER_OPTIONS,
} from "@/lib/transactions/labels";
import { cn } from "@/lib/utils";

export type ClientDetailData = {
  id: string;
  name: string;
  category: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  notes: string | null;
  tags: string[];
  createdAt: string;
};

export type ClientTransactionItem = {
  id: string;
  code: string;
  type: string;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: string;
  currency: string;
  createdAt: string;
};

type ClientDetailPanelProps = {
  client: ClientDetailData;
  transactions: ClientTransactionItem[];
  transactionsPagination: PaginationMeta;
  stats: {
    totalSpent: number;
    balanceDue: number;
    transactionCount: number;
  };
  canEditClient?: boolean;
};

const statusFilterOptions = PAYMENT_STATUS_FILTER_OPTIONS.map((option) => ({
  value: option.value,
  label: option.label,
}));

function statusBadgeClass(status: string) {
  switch (status) {
    case "SOLDE":
      return "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300";
    case "LITIGE_ANNULE":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300";
    case "EN_COURS_REALISE":
      return "bg-sky-100 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300";
    default:
      return "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300";
  }
}

function TransactionDate({ isoDate }: { isoDate: string }) {
  const [label, setLabel] = useState("");

  useEffect(() => {
    setLabel(format(new Date(isoDate), "d MMM yyyy", { locale: fr }));
  }, [isoDate]);

  return (
    <p className="text-xs text-slate-500 dark:text-slate-400" suppressHydrationWarning>
      {label || "—"}
    </p>
  );
}

export function ClientDetailPanel({
  client: initialClient,
  transactions,
  transactionsPagination,
  stats,
  canEditClient = false,
}: ClientDetailPanelProps) {
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [client, setClient] = useState(initialClient);

  useEffect(() => {
    setClient(initialClient);
  }, [initialClient.id]);

  const filteredTransactions = useMemo(() => {
    if (statusFilter === "ALL") {
      return transactions;
    }

    return transactions.filter((transaction) => transaction.status === statusFilter);
  }, [statusFilter, transactions]);

  return (
    <div className="space-y-6">
      <Link
        href="/clients"
        className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 hover:text-[#10579F] dark:text-sky-400"
      >
        <ArrowLeft className="size-4" />
        Retour au répertoire
      </Link>

      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")}>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-xl font-semibold text-[#10579F] dark:text-sky-50">{client.name}</h1>
              <span className="rounded-full bg-sky-100 px-2.5 py-0.5 text-xs font-medium text-[#10579F] dark:bg-sky-950/40 dark:text-sky-300">
                {getClientCategoryLabel(client.category)}
              </span>
            </div>
            <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
              {[client.phone, client.email, client.address].filter(Boolean).join(" · ") ||
                "Aucune coordonnée renseignée"}
            </p>
            {client.notes ? (
              <p className="text-sm leading-relaxed text-slate-500 dark:text-slate-400">{client.notes}</p>
            ) : null}
            {client.tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 pt-1" data-testid="client-detail-tags">
                {client.tags.map((tag) => (
                  <ClientTagBadge key={tag} tag={tag} />
                ))}
              </div>
            ) : null}
          </div>
        </div>
      </section>

      {canEditClient ? (
        <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="client-tags-section">
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Tags & segmentation
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Identifiez les clients VIP, mauvais payeurs ou conditions spécifiques.
            </p>
          </div>

          <ClientTagsEditor
            clientId={client.id}
            tags={client.tags}
            onTagsChange={(tags) => setClient((current) => ({ ...current, tags }))}
          />
        </section>
      ) : null}

      {canEditClient ? (
        <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="client-edit-section">
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Coordonnées & notes
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Les modifications n&apos;impactent pas les transactions déjà enregistrées.
            </p>
          </div>

          <ClientEditForm
            client={client as ClientEditData}
            formId="client-detail-edit-form"
            onUpdated={(updatedClient) => setClient((current) => ({ ...current, ...updatedClient }))}
            showActions
          />
        </section>
      ) : null}

      <section className="grid gap-4 sm:grid-cols-3">
        <article className={cn(mbokaPanelClassName, "p-5")} data-testid="client-stat-total-spent">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Total encaissé
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#10579F] dark:text-sky-50">
            {formatMoney(stats.totalSpent)}
          </p>
        </article>

        <article className={cn(mbokaPanelClassName, "p-5")} data-testid="client-stat-balance-due">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Solde restant dû
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#10579F] dark:text-sky-50">
            {formatMoney(stats.balanceDue)}
          </p>
        </article>

        <article className={cn(mbokaPanelClassName, "p-5")} data-testid="client-stat-transactions">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Transactions
          </p>
          <p className="mt-2 text-2xl font-semibold text-[#10579F] dark:text-sky-50">
            {stats.transactionCount}
          </p>
        </article>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Historique des transactions
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Filtrez par statut de paiement pour analyser les encours et factures soldées.
            </p>
          </div>

          <div className="w-full max-w-xs space-y-2">
            <label htmlFor="statusFilter" className={mbokaLabelClassName}>
              Statut de paiement
            </label>
            <MbokaSelect
              id="statusFilter"
              name="statusFilter"
              value={statusFilter}
              onValueChange={setStatusFilter}
              options={statusFilterOptions}
            />
          </div>
        </div>

        {filteredTransactions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="client-transactions-empty">
            {transactionsPagination.total > 0 && statusFilter !== "ALL"
              ? "Aucune transaction ne correspond à ce filtre sur cette page."
              : "Aucune transaction enregistrée pour ce client."}
          </p>
        ) : (
          <div className="space-y-3" data-testid="client-transactions-list">
            {filteredTransactions.map((transaction) => (
              <article
                key={transaction.id}
                data-testid={`client-transaction-${transaction.id}`}
                className="flex flex-col gap-3 rounded-2xl border border-sky-100 bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between dark:border-sky-900 dark:bg-slate-900/50"
              >
                <div className="flex items-start gap-3">
                  <div className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
                    <Receipt className="size-4" />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <p className="text-sm font-semibold text-[#10579F] dark:text-sky-50">
                      {transaction.code}
                    </p>
                    <TransactionDate isoDate={transaction.createdAt} />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-3 sm:justify-end">
                  <span
                    className={cn(
                      "rounded-full px-2.5 py-0.5 text-[11px] font-medium",
                      statusBadgeClass(transaction.status)
                    )}
                  >
                    {getPaymentStatusLabel(transaction.status)}
                  </span>
                  <div className="text-right text-xs text-slate-600 dark:text-slate-400">
                    <p>Total {formatMoney(transaction.totalAmount)}</p>
                    <p>Payé {formatMoney(transaction.paidAmount)} · Reste {formatMoney(transaction.remainingAmount)}</p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        <MbokaPagination
          meta={transactionsPagination}
          buildHref={(page, pageSize) =>
            buildClientDetailHref(client.id, {
              txPage: page,
              txPageSize: pageSize ?? transactionsPagination.pageSize,
            })
          }
        />
      </section>
    </div>
  );
}
