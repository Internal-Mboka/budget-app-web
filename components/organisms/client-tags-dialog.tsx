"use client";

import { MbokaDialog } from "@/components/molecules/mboka-dialog";
import { ClientTagsEditor } from "@/components/organisms/client-tags-editor";

type ClientTagsDialogProps = {
  open: boolean;
  client: { id: string; name: string; tags: string[] } | null;
  onOpenChange: (open: boolean) => void;
  onTagsChange?: (clientId: string, tags: string[]) => void;
};

export function ClientTagsDialog({
  open,
  client,
  onOpenChange,
  onTagsChange,
}: ClientTagsDialogProps) {
  if (!client) {
    return null;
  }

  return (
    <MbokaDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Tags — ${client.name}`}
      description="Segmentation commerciale et conditions spécifiques."
      size="sm"
      testId="client-tags-dialog"
      backdropTestId="client-tags-backdrop"
    >
      <ClientTagsEditor
        clientId={client.id}
        tags={client.tags}
        onTagsChange={(tags) => onTagsChange?.(client.id, tags)}
      />
    </MbokaDialog>
  );
}
