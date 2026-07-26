"use client";

import {
  ClientEditForm,
  type ClientEditData,
} from "@/components/organisms/client-edit-form";
import { MbokaDialog } from "@/components/molecules/mboka-dialog";

type ClientEditDialogProps = {
  client: ClientEditData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdated?: (client: ClientEditData) => void;
};

export function ClientEditDialog({
  client,
  open,
  onOpenChange,
  onUpdated,
}: ClientEditDialogProps) {
  if (!client) {
    return null;
  }

  return (
    <MbokaDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Modifier la fiche client"
      description="Mettez à jour les coordonnées et les notes sans affecter l'historique financier."
      size="md"
      testId="client-edit-dialog"
      backdropTestId="client-edit-backdrop"
    >
      <ClientEditForm
        client={client}
        formId="client-edit-dialog-form"
        onUpdated={(updatedClient) => {
          onUpdated?.(updatedClient);
          onOpenChange(false);
        }}
        onCancel={() => onOpenChange(false)}
      />
    </MbokaDialog>
  );
}
