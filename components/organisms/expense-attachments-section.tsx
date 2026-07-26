"use client";

import { useRouter } from "next/navigation";
import { FileText, ImageIcon, Upload } from "lucide-react";
import { useActionState, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { MbokaPendingFieldset, MbokaSubmitButton } from "@/components/molecules/mboka-submit-button";
import {
  uploadExpenseAttachmentFormAction,
  type UploadExpenseAttachmentFormState,
} from "@/lib/actions/expense-attachments";
import {
  formatAttachmentSize,
  isImageAttachment,
  type ExpenseAttachment,
} from "@/lib/expenses/attachments";
import { mbokaLabelClassName, mbokaPanelClassName } from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type ExpenseAttachmentsSectionProps = {
  transactionId: string;
  attachments: ExpenseAttachment[];
  canUpload: boolean;
};

export function ExpenseAttachmentsSection({
  transactionId,
  attachments,
  canUpload,
}: ExpenseAttachmentsSectionProps) {
  const handledRef = useRef<UploadExpenseAttachmentFormState>(null);
  const router = useRouter();
  const [state, formAction] = useActionState(uploadExpenseAttachmentFormAction, null);
  const [selectedFileName, setSelectedFileName] = useState("");

  useEffect(() => {
    if (!state || state === handledRef.current) {
      return;
    }

    handledRef.current = state;

    if (state.success) {
      toast.success("Pièce justificative téléversée.");
      setSelectedFileName("");
      router.refresh();
    } else {
      toast.error(state.error);
    }
  }, [state]);

  return (
    <section
      className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")}
      data-testid="expense-attachments-section"
    >
      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
          <Upload className="size-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Pièces justificatives</h3>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
            Factures, reçus ou photos de caisse (JPG, PNG, WEBP, PDF — max. 5 Mo).
          </p>
        </div>
      </div>

      {attachments.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2" data-testid="expense-attachments-list">
          {attachments.map((attachment) => (
            <article
              key={attachment.id}
              data-testid={`expense-attachment-${attachment.id}`}
              className="overflow-hidden rounded-2xl border border-sky-100 bg-white/80 dark:border-sky-900 dark:bg-slate-900/50"
            >
              {isImageAttachment(attachment.mimeType) ? (
                <a href={attachment.url} target="_blank" rel="noreferrer" className="block">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={attachment.url}
                    alt={attachment.fileName}
                    className="h-40 w-full object-cover"
                    data-testid={`expense-attachment-preview-${attachment.id}`}
                  />
                </a>
              ) : (
                <a
                  href={attachment.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-40 flex-col items-center justify-center gap-2 bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
                >
                  <FileText className="size-8" />
                  <span className="text-xs font-medium">Ouvrir le PDF</span>
                </a>
              )}

              <div className="space-y-1 px-4 py-3">
                <div className="flex items-center gap-2">
                  {isImageAttachment(attachment.mimeType) ? (
                    <ImageIcon className="size-4 shrink-0 text-sky-500" />
                  ) : (
                    <FileText className="size-4 shrink-0 text-sky-500" />
                  )}
                  <a
                    href={attachment.url}
                    target="_blank"
                    rel="noreferrer"
                    className="truncate text-sm font-medium text-[#10579F] hover:underline dark:text-sky-50"
                  >
                    {attachment.fileName}
                  </a>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {formatAttachmentSize(attachment.sizeBytes)}
                </p>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400" data-testid="expense-attachments-empty">
          Aucune pièce justificative jointe.
        </p>
      )}

      {canUpload ? (
        <form action={formAction} className="space-y-4" data-testid="expense-attachment-form">
          <input type="hidden" name="transactionId" value={transactionId} />

          <MbokaPendingFieldset>
            <div className="space-y-2">
              <label htmlFor="expenseAttachmentFile" className={mbokaLabelClassName}>
                Téléverser un document
              </label>
              <input
                id="expenseAttachmentFile"
                name="file"
                type="file"
                accept="image/jpeg,image/png,image/webp,application/pdf"
                required
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  setSelectedFileName(file?.name ?? "");
                }}
                className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#10579F] hover:file:bg-sky-100 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-sky-50"
              />
              {selectedFileName ? (
                <p className="text-xs text-slate-500 dark:text-slate-400">Fichier sélectionné : {selectedFileName}</p>
              ) : null}
            </div>

            {selectedFileName ? (
              <MbokaSubmitButton testId="expense-attachment-submit" pendingLabel="Téléversement...">
                Joindre la pièce justificative
              </MbokaSubmitButton>
            ) : null}
          </MbokaPendingFieldset>
        </form>
      ) : null}
    </section>
  );
}
