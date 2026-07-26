"use client";

import { Download, Loader2, Upload } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { importClientsAction } from "@/lib/actions/clients";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

export function ClientImportExportPanel() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [hasSelectedFile, setHasSelectedFile] = useState(false);

  function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    setHasSelectedFile((event.target.files?.length ?? 0) > 0);
  }

  async function handleImport(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsImporting(true);

    const form = event.currentTarget;
    const formData = new FormData(form);
    const result = await importClientsAction(formData);

    if (!result.success) {
      toast.error(result.error ?? "Import échoué.");
      if (result.errors.length > 0) {
        toast.message(result.errors.slice(0, 3).join("\n"));
      }
      setIsImporting(false);
      return;
    }

    toast.success(`${result.created} client(s) importé(s).`);
    if (result.skipped > 0) {
      toast.message(`${result.skipped} ligne(s) ignorée(s).`);
    }

    form.reset();
    setHasSelectedFile(false);
    router.refresh();
    setIsImporting(false);
  }

  return (
    <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")} data-testid="client-import-export-panel">
      <div>
        <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
          Import & export
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
          Exportez le répertoire avec statut de compte et chiffre d&apos;affaires, ou importez une
          liste CSV validée.
        </p>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/clients/export"
          data-testid="client-export-link"
          className={cn(mbokaButtonOutlineClassName, "no-underline")}
        >
          <Download className="size-4" />
          Exporter en CSV
        </Link>
      </div>

      <form onSubmit={handleImport} className="space-y-4" data-testid="client-import-form">
        <div className="space-y-2">
          <label htmlFor="clientImportFile" className={mbokaLabelClassName}>
            Importer un fichier CSV
          </label>
          <input
            ref={fileInputRef}
            id="clientImportFile"
            name="file"
            type="file"
            accept=".csv,text/csv"
            required
            data-testid="client-import-file"
            onChange={handleFileChange}
            className="block w-full text-sm text-slate-600 file:mr-4 file:rounded-xl file:border-0 file:bg-sky-50 file:px-4 file:py-2 file:text-sm file:font-medium file:text-[#10579F] hover:file:bg-sky-100 dark:text-slate-300 dark:file:bg-slate-800 dark:file:text-sky-100"
          />
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Colonnes attendues : Nom, Catégorie, Téléphone, Email, Adresse, Notes.
          </p>
        </div>

        {hasSelectedFile ? (
          <button
            type="submit"
            className={mbokaButtonPrimaryClassName}
            disabled={isImporting}
            data-testid="client-import-submit"
          >
            {isImporting ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Import en cours...
              </>
            ) : (
              <>
                <Upload className="size-4" />
                Importer
              </>
            )}
          </button>
        ) : null}
      </form>
    </section>
  );
}
