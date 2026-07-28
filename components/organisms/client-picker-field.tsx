"use client";

import { useState } from "react";

import { ClientAutocomplete } from "@/components/molecules/client-autocomplete";
import { ClientQuickCreateDialog } from "@/components/organisms/client-quick-create-dialog";
import type { ClientSearchResult } from "@/lib/clients/search";

type ClientPickerFieldProps = {
  value: ClientSearchResult | null;
  onChange: (client: ClientSearchResult | null) => void;
  label?: string;
  placeholder?: string;
  disabled?: boolean;
  autoFocus?: boolean;
};

export function ClientPickerField({
  value,
  onChange,
  label,
  placeholder,
  disabled = false,
  autoFocus = false,
}: ClientPickerFieldProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [prefillName, setPrefillName] = useState("");

  function handleCreateRequest(query: string) {
    setPrefillName(query);
    setDialogOpen(true);
  }

  return (
    <>
      <ClientAutocomplete
        label={label}
        placeholder={placeholder}
        selectedClient={value}
        onSelect={onChange}
        onCreateRequest={handleCreateRequest}
        disabled={disabled}
        autoFocus={autoFocus}
      />

      <ClientQuickCreateDialog
        open={dialogOpen}
        defaultName={prefillName}
        onOpenChange={setDialogOpen}
        onCreated={onChange}
      />
    </>
  );
}
