"use client";

import { Loader2, ShieldCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import {
  beginTwoFactorSetupAction,
  confirmTwoFactorSetupAction,
  disableTwoFactorAction,
} from "@/lib/actions/two-factor";
import {
  mbokaButtonOutlineClassName,
  mbokaButtonPrimaryClassName,
  mbokaFieldClassName,
  mbokaLabelClassName,
  mbokaPanelClassName,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type TwoFactorSettingsProps = {
  enabled: boolean;
};

export function TwoFactorSettings({ enabled }: TwoFactorSettingsProps) {
  const router = useRouter();
  const [isEnabled, setIsEnabled] = useState(enabled);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [setupCode, setSetupCode] = useState("");
  const [disableCode, setDisableCode] = useState("");
  const [isStartingSetup, setIsStartingSetup] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [isDisabling, setIsDisabling] = useState(false);

  async function handleBeginSetup() {
    setIsStartingSetup(true);

    const result = await beginTwoFactorSetupAction();

    if (!result.success) {
      toast.error(result.error);
      setIsStartingSetup(false);
      return;
    }

    setQrDataUrl(result.qrDataUrl ?? null);
    setIsStartingSetup(false);
    toast.success("Scannez le QR code avec votre application Authenticator.");
  }

  async function handleConfirmSetup(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsConfirming(true);

    const formData = new FormData();
    formData.set("code", setupCode);

    const result = await confirmTwoFactorSetupAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsConfirming(false);
      return;
    }

    setIsEnabled(true);
    setQrDataUrl(null);
    setSetupCode("");
    toast.success("Authentification à deux facteurs activée.");
    setIsConfirming(false);
    router.refresh();
  }

  async function handleDisable(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDisabling(true);

    const formData = new FormData();
    formData.set("code", disableCode);

    const result = await disableTwoFactorAction(formData);

    if (!result.success) {
      toast.error(result.error);
      setIsDisabling(false);
      return;
    }

    setIsEnabled(false);
    setDisableCode("");
    toast.success("Authentification à deux facteurs désactivée.");
    setIsDisabling(false);
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <section className={cn(mbokaPanelClassName, "space-y-4 p-6")}>
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-[#10579F] dark:bg-slate-800 dark:text-sky-50">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[#10579F] dark:text-sky-50">
              Statut de la 2FA
            </h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              {isEnabled
                ? "Votre compte exige un code OTP à chaque connexion."
                : "Protégez votre compte avec une application Authenticator (Google Authenticator, Authy, etc.)."}
            </p>
            <p
              data-testid="two-factor-status"
              className={cn(
                "mt-3 inline-flex rounded-full px-2.5 py-1 text-xs font-medium",
                isEnabled
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300"
              )}
            >
              {isEnabled ? "Activée" : "Désactivée"}
            </p>
          </div>
        </div>
      </section>

      {!isEnabled ? (
        <section className={cn(mbokaPanelClassName, "space-y-5 p-6")} data-testid="two-factor-setup">
          {!qrDataUrl ? (
            <button
              type="button"
              data-testid="begin-two-factor-setup"
              className={mbokaButtonPrimaryClassName}
              disabled={isStartingSetup}
              onClick={() => {
                void handleBeginSetup();
              }}
            >
              {isStartingSetup ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Préparation...
                </>
              ) : (
                "Activer la 2FA"
              )}
            </button>
          ) : (
            <div className="space-y-5">
              <div className="flex justify-center">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={qrDataUrl}
                  alt="QR code Authenticator"
                  width={220}
                  height={220}
                  className="rounded-2xl border border-sky-100 bg-white p-3 dark:border-sky-900"
                  data-testid="two-factor-qr"
                />
              </div>

              <form onSubmit={handleConfirmSetup} className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="setupCode" className={mbokaLabelClassName}>
                    Code de vérification
                  </label>
                  <input
                    id="setupCode"
                    data-testid="two-factor-setup-code"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="123456"
                    className={cn(mbokaFieldClassName, "text-center tracking-[0.3em]")}
                    value={setupCode}
                    onChange={(event) => {
                      setSetupCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                    }}
                    required
                  />
                </div>

                <button type="submit" className={mbokaButtonPrimaryClassName} disabled={isConfirming}>
                  {isConfirming ? (
                    <>
                      <Loader2 className="size-4 animate-spin" />
                      Activation...
                    </>
                  ) : (
                    "Confirmer l'activation"
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      ) : (
        <section className={cn(mbokaPanelClassName, "space-y-4 p-6")} data-testid="two-factor-disable">
          <form onSubmit={handleDisable} className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="disableCode" className={mbokaLabelClassName}>
                Code OTP pour désactiver
              </label>
              <input
                id="disableCode"
                data-testid="two-factor-disable-code"
                inputMode="numeric"
                maxLength={6}
                placeholder="123456"
                className={cn(mbokaFieldClassName, "text-center tracking-[0.3em]")}
                value={disableCode}
                onChange={(event) => {
                  setDisableCode(event.target.value.replace(/\D/g, "").slice(0, 6));
                }}
                required
              />
            </div>

            <button
              type="submit"
              className={cn(mbokaButtonOutlineClassName, "border-rose-200 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-300 dark:hover:bg-rose-950/30")}
              disabled={isDisabling}
            >
              {isDisabling ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Désactivation...
                </>
              ) : (
                "Désactiver la 2FA"
              )}
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
