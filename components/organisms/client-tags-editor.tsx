"use client";

import { Loader2, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { ClientTagBadge } from "@/components/molecules/client-tag-badge";
import { addClientTagAction, removeClientTagAction } from "@/lib/actions/clients";
import { CLIENT_TAG_SUGGESTIONS, tagsMatch } from "@/lib/clients/tags";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ClientTagsEditorProps = {
  clientId: string;
  tags: string[];
  onTagsChange?: (tags: string[]) => void;
  readOnly?: boolean;
};

export function ClientTagsEditor({
  clientId,
  tags,
  onTagsChange,
  readOnly = false,
}: ClientTagsEditorProps) {
  const [draftTag, setDraftTag] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  async function handleAddTag(tagValue: string) {
    const tag = tagValue.trim();
    if (!tag) {
      return;
    }

    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("clientId", clientId);
      formData.set("tag", tag);

      const result = await addClientTagAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onTagsChange?.(result.tags);
      setDraftTag("");
      toast.success("Tag ajouté.");
    } catch {
      toast.error("Impossible d'ajouter le tag.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleRemoveTag(tag: string) {
    setIsSaving(true);

    try {
      const formData = new FormData();
      formData.set("clientId", clientId);
      formData.set("tag", tag);

      const result = await removeClientTagAction(formData);

      if (!result.success) {
        toast.error(result.error);
        return;
      }

      onTagsChange?.(result.tags);
      toast.success("Tag retiré.");
    } catch {
      toast.error("Impossible de retirer le tag.");
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <div className="space-y-4" data-testid="client-tags-editor">
      <div className="flex flex-wrap gap-2" data-testid="client-tags-list">
        {tags.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Aucun tag pour ce client.</p>
        ) : (
          tags.map((tag) => (
            <ClientTagBadge
              key={tag}
              tag={tag}
              onRemove={readOnly ? undefined : () => handleRemoveTag(tag)}
            />
          ))
        )}
      </div>

      {readOnly ? null : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <label htmlFor={`client-tag-input-${clientId}`} className={mbokaLabelClassName}>
                Nouveau tag
              </label>
              <input
                id={`client-tag-input-${clientId}`}
                value={draftTag}
                onChange={(event) => setDraftTag(event.target.value)}
                placeholder="Ex. VIP, Mauvais payeur…"
                className={mbokaFieldClassName}
                data-testid="client-tag-input"
              />
            </div>
            <button
              type="button"
              className={cn(mbokaButtonPrimaryClassName, "sm:mb-0.5")}
              disabled={isSaving || !draftTag.trim()}
              data-testid="client-tag-add-button"
              onClick={() => handleAddTag(draftTag)}
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
              Ajouter
            </button>
          </div>

          <div className="flex flex-wrap gap-2">
            {CLIENT_TAG_SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                type="button"
                disabled={isSaving || tags.some((existingTag) => tagsMatch(existingTag, suggestion))}
                data-testid={`client-tag-suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-")}`}
                className={cn(mbokaButtonOutlineClassName, "px-3 py-1.5 text-xs")}
                onClick={() => handleAddTag(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
