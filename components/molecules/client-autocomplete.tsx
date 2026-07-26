"use client";

import { Loader2, Plus, Search, UserRound, X } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";

import { searchClientsAction } from "@/lib/actions/clients";
import { getClientCategoryLabel } from "@/lib/clients/categories";
import { CLIENT_SEARCH_MIN_LENGTH, type ClientSearchResult } from "@/lib/clients/search";
import { mbokaFieldClassName, mbokaLabelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientAutocompleteProps = {
  id?: string;
  label?: string;
  placeholder?: string;
  selectedClient: ClientSearchResult | null;
  onSelect: (client: ClientSearchResult | null) => void;
  onCreateRequest: (query: string) => void;
  disabled?: boolean;
};

export function ClientAutocomplete({
  id,
  label = "Client",
  placeholder = "Rechercher par nom, téléphone ou catégorie…",
  selectedClient,
  onSelect,
  onCreateRequest,
  disabled = false,
}: ClientAutocompleteProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const listboxId = `${inputId}-listbox`;
  const containerRef = useRef<HTMLDivElement>(null);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ClientSearchResult[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [isOpen]);

  useEffect(() => {
    if (selectedClient) {
      setQuery(selectedClient.name);
    }
  }, [selectedClient]);

  useEffect(() => {
    if (disabled || selectedClient) {
      return;
    }

    const term = query.trim();
    if (term.length < CLIENT_SEARCH_MIN_LENGTH) {
      setResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timeoutId = window.setTimeout(async () => {
      try {
        const matches = await searchClientsAction(term);
        setResults(matches);
        setIsOpen(true);
      } catch {
        setResults([]);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => window.clearTimeout(timeoutId);
  }, [disabled, query, selectedClient]);

  function handleClearSelection() {
    onSelect(null);
    setQuery("");
    setResults([]);
    setIsOpen(false);
  }

  function handleSelect(client: ClientSearchResult) {
    onSelect(client);
    setQuery(client.name);
    setIsOpen(false);
  }

  const showDropdown =
    isOpen && !selectedClient && query.trim().length >= CLIENT_SEARCH_MIN_LENGTH;

  return (
    <div ref={containerRef} className="relative space-y-2">
      <label htmlFor={inputId} className={mbokaLabelClassName}>
        {label}
      </label>

      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-slate-400" />
        <input
          id={inputId}
          type="search"
          value={query}
          disabled={disabled}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listboxId}
          data-testid="client-autocomplete-input"
          className={cn(mbokaFieldClassName, "pr-12 pl-11")}
          onFocus={() => {
            if (!selectedClient && query.trim().length >= CLIENT_SEARCH_MIN_LENGTH) {
              setIsOpen(true);
            }
          }}
          onChange={(event) => {
            const nextValue = event.target.value;
            setQuery(nextValue);

            if (selectedClient && nextValue !== selectedClient.name) {
              onSelect(null);
            }
          }}
        />

        {selectedClient ? (
          <button
            type="button"
            aria-label="Effacer la sélection"
            data-testid="client-autocomplete-clear"
            className="absolute top-1/2 right-3 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-sky-50 hover:text-[#10579F] dark:hover:bg-slate-800"
            onClick={handleClearSelection}
          >
            <X className="size-4" />
          </button>
        ) : isSearching ? (
          <Loader2 className="pointer-events-none absolute top-1/2 right-4 size-4 -translate-y-1/2 animate-spin text-slate-400" />
        ) : null}
      </div>

      {showDropdown ? (
        <div
          id={listboxId}
          role="listbox"
          data-testid="client-autocomplete-results"
          className="absolute z-40 mt-2 w-full overflow-hidden rounded-2xl border border-sky-100 bg-white shadow-xl shadow-sky-100/60 dark:border-sky-900 dark:bg-slate-900 dark:shadow-sky-950/40"
        >
          {results.length === 0 && !isSearching ? (
            <p className="px-4 py-3 text-sm text-slate-500 dark:text-slate-400">
              Aucun client trouvé pour « {query.trim()} ».
            </p>
          ) : (
            <ul className="max-h-64 overflow-y-auto py-1.5">
              {results.map((client) => (
                <li key={client.id}>
                  <button
                    type="button"
                    role="option"
                    data-testid={`client-autocomplete-option-${client.id}`}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left transition hover:bg-sky-50 dark:hover:bg-slate-800"
                    onClick={() => handleSelect(client)}
                  >
                    <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
                      <UserRound className="size-4" />
                    </span>
                    <span className="min-w-0 space-y-0.5">
                      <span className="block text-sm font-semibold text-[#10579F] dark:text-sky-50">
                        {client.name}
                      </span>
                      <span className="block text-xs text-slate-500 dark:text-slate-400">
                        {getClientCategoryLabel(client.category)}
                        {client.phone ? ` · ${client.phone}` : ""}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="border-t border-sky-100 p-2 dark:border-sky-900">
            <button
              type="button"
              data-testid="client-autocomplete-create"
              className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-[#10579F] transition hover:bg-sky-50 dark:text-sky-100 dark:hover:bg-slate-800"
              onClick={() => onCreateRequest(query.trim())}
            >
              <Plus className="size-4" />
              Créer un client « {query.trim() || "nouveau"} »
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
