"use client";

import { format, parseISO } from "date-fns";
import { fr } from "date-fns/locale";
import { BellRing, Loader2, Radio, Webhook } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { sendAlertPingAction, updateAlertSettingsAction } from "@/lib/actions/alerts";
import { CRITICAL_ALERT_TYPES, getCriticalAlertTypeLabel } from "@/lib/alerts/config";
import type { AlertSettingsRecord } from "@/lib/alerts/load-settings";
import { getExpenseApprovalThreshold } from "@/lib/expenses/approval";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AlertSettingsPanelProps = {
  settings: AlertSettingsRecord;
};

export function AlertSettingsPanel({ settings }: AlertSettingsPanelProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const [isPinging, setIsPinging] = useState(false);
  const [webhookEnabled, setWebhookEnabled] = useState(settings.webhookEnabled);

  const defaultThreshold = settings.adjustmentThresholdUsd ?? getExpenseApprovalThreshold();
  const updatedLabel = settings.updatedByUserId
    ? format(parseISO(settings.updatedAt), "d MMM yyyy · HH:mm", { locale: fr })
    : null;

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);

    const formData = new FormData(event.currentTarget);
    const result = await updateAlertSettingsAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsSaving(false);
      return;
    }

    toast.success(result.message ?? "Configuration enregistrée.");
    setIsSaving(false);
    router.refresh();
  }

  async function handlePing() {
    setIsPinging(true);
    const result = await sendAlertPingAction();

    if (!result.success) {
      toast.error(result.error);
      setIsPinging(false);
      return;
    }

    toast.success(result.message ?? "Test envoyé.");
    setIsPinging(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4 p-5 sm:p-6")} data-testid="alert-settings-panel">
        <div className="flex items-start gap-3">
          <div className="flex size-10 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-300">
            <BellRing className="size-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">Paramètres de notification</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Définissez comment alerter la direction en cas d&apos;événement critique (caisse, seuils, clôtures
              trimestrielles).
            </p>
            {updatedLabel ? (
              <p className="text-xs text-slate-400">Dernière mise à jour : {updatedLabel}</p>
            ) : null}
          </div>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="grid gap-3 sm:grid-cols-3">
            <ToggleField
              name="alertsEnabled"
              label="Notifications actives"
              description="Active ou coupe toutes les alertes critiques."
              defaultChecked={settings.alertsEnabled}
              testId="alert-settings-enabled"
            />
            <ToggleField
              name="emailEnabled"
              label="Par email"
              description={
                settings.emailProviderConfigured
                  ? "Envoi par email opérationnel."
                  : "Mode test : aucun email réel n'est envoyé pour l'instant."
              }
              defaultChecked={settings.emailEnabled}
              testId="alert-settings-email"
            />
            <ToggleField
              name="webhookEnabled"
              label="Messagerie d'équipe"
              description="Discord, Slack ou autre canal de discussion."
              defaultChecked={settings.webhookEnabled}
              testId="alert-settings-webhook"
              onCheckedChange={setWebhookEnabled}
            />
          </div>

          <div
            className={cn(
              "grid gap-4 md:grid-cols-2",
              !webhookEnabled && "pointer-events-none opacity-50"
            )}
          >
            <div>
              <label htmlFor="webhookUrl" className={mbokaLabelClassName}>
                Lien du canal
              </label>
              <input
                id="webhookUrl"
                name="webhookUrl"
                type="url"
                defaultValue={settings.webhookUrl ?? ""}
                placeholder="Coller le lien fourni par Discord ou Slack…"
                className={mbokaFieldClassName}
                disabled={!webhookEnabled}
                data-testid="alert-settings-webhook-url"
              />
              {webhookEnabled && settings.envFallbackActive ? (
                <p className="mt-1 text-xs text-slate-500">
                  Une adresse est déjà configurée côté serveur — laissez vide pour l&apos;utiliser.
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="webhookSecret" className={mbokaLabelClassName}>
                Clé de sécurité du canal
              </label>
              <input
                id="webhookSecret"
                name="webhookSecret"
                type="password"
                placeholder={
                  settings.webhookSecretConfigured ? "Laisser vide pour conserver la clé actuelle" : "Optionnel"
                }
                className={mbokaFieldClassName}
                autoComplete="new-password"
                disabled={!webhookEnabled}
                data-testid="alert-settings-webhook-secret"
              />
              <p className="mt-1 text-xs text-slate-500">
                {webhookEnabled
                  ? settings.webhookSecretConfigured
                    ? "Clé enregistrée — protège les messages envoyés vers votre canal."
                    : "Optionnel — sécurise les messages envoyés vers votre canal."
                  : "Activez la messagerie d'équipe pour configurer ce canal."}
              </p>
            </div>
          </div>

          <div className="max-w-xs">
            <label htmlFor="adjustmentThresholdUsd" className={mbokaLabelClassName}>
              Seuil régularisation élevée (USD)
            </label>
            <input
              id="adjustmentThresholdUsd"
              name="adjustmentThresholdUsd"
              type="number"
              min={1}
              step={1}
              defaultValue={defaultThreshold}
              className={mbokaFieldClassName}
              data-testid="alert-settings-threshold"
            />
          </div>

          <fieldset className="space-y-3">
            <legend className={mbokaLabelClassName}>Événements à ne pas notifier</legend>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Cochez les alertes à ignorer ; les autres continueront d&apos;être envoyées.
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {CRITICAL_ALERT_TYPES.map((type) => (
                <label
                  key={type}
                  className="flex items-start gap-2 rounded-2xl border border-sky-100 bg-sky-50/40 px-3 py-2.5 text-sm dark:border-sky-900 dark:bg-slate-900/40"
                >
                  <input
                    type="checkbox"
                    name="disabledAlertTypes"
                    value={type}
                    defaultChecked={settings.disabledAlertTypes.includes(type)}
                    className="mt-0.5"
                    data-testid={`alert-settings-disable-${type}`}
                  />
                  <span>{getCriticalAlertTypeLabel(type)}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="flex flex-wrap gap-2">
            <button
              type="submit"
              disabled={isSaving}
              className={cn(mbokaButtonPrimaryClassName, "min-w-40")}
              data-testid="alert-settings-save"
            >
              {isSaving ? <Loader2 className="size-4 animate-spin" /> : null}
              Enregistrer
            </button>
            <button
              type="button"
              disabled={isPinging}
              onClick={handlePing}
              className={cn(mbokaButtonOutlineClassName, "min-w-40")}
              data-testid="alert-settings-ping"
            >
              {isPinging ? <Loader2 className="size-4 animate-spin" /> : <Radio className="size-4" />}
              Tester les notifications
            </button>
          </div>
        </form>
      </section>

      <section className={cn(mbokaPanelClassName, "space-y-3 p-5 sm:p-6")} data-testid="alert-settings-push-soon">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#10579F] dark:text-sky-50">
          <Webhook className="size-4" />
          Notifications dans le navigateur
        </div>
        <p className="text-sm leading-6 text-slate-600 dark:text-slate-300">
          Bientôt disponibles. L&apos;email et la messagerie d&apos;équipe couvrent déjà les alertes critiques pour
          la direction.
        </p>
      </section>
    </div>
  );
}

function ToggleField({
  name,
  label,
  description,
  defaultChecked,
  testId,
  onCheckedChange,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
  testId: string;
  onCheckedChange?: (checked: boolean) => void;
}) {
  return (
    <label className="flex h-full cursor-pointer flex-col gap-2 rounded-2xl border border-sky-100 bg-white/80 p-3 dark:border-sky-900 dark:bg-slate-900/50">
      <span className="flex items-center justify-between gap-2">
        <span className="text-sm font-medium text-[#10579F] dark:text-sky-50">{label}</span>
        <input
          type="checkbox"
          name={name}
          defaultChecked={defaultChecked}
          data-testid={testId}
          onChange={(event) => onCheckedChange?.(event.target.checked)}
        />
      </span>
      <span className="text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</span>
    </label>
  );
}
