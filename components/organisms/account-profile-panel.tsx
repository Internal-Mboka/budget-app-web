import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Fingerprint, KeyRound, MonitorSmartphone } from "lucide-react";
import Link from "next/link";

import {
  getAccountProfileDisplayName,
  getAccountProfileInitials,
  type AccountProfile,
} from "@/lib/account/load-profile";
import {
  mbokaButtonOutlineClassName,
  mbokaPanelClassName,
  ROLE_LABELS,
} from "@/lib/design-tokens";
import { cn } from "@/lib/utils";

type AccountProfilePanelProps = {
  profile: AccountProfile;
};

const accountLinks = [
  {
    href: "/account/password",
    label: "Mot de passe",
    description: "Modifier votre mot de passe de connexion",
    icon: KeyRound,
    testId: "profile-link-password",
  },
  {
    href: "/account/sessions",
    label: "Sessions actives",
    description: "Appareils connectés et déconnexion à distance",
    icon: MonitorSmartphone,
    testId: "profile-link-sessions",
  },
  {
    href: "/account/two-factor",
    label: "Authentification 2FA",
    description: "Renforcer la sécurité de votre compte",
    icon: Fingerprint,
    testId: "profile-link-two-factor",
  },
] as const;

export function AccountProfilePanel({ profile }: AccountProfilePanelProps) {
  const displayName = getAccountProfileDisplayName(profile);
  const initials = getAccountProfileInitials(profile);
  const roleLabel = ROLE_LABELS[profile.roleName] ?? profile.roleName;
  const memberSince = format(profile.createdAt, "d MMMM yyyy", { locale: fr });

  return (
    <div className="space-y-6" data-testid="account-profile-panel">
      <section className={cn(mbokaPanelClassName, "space-y-5 p-5 sm:p-6")}>
        <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
          {profile.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- avatar URL externe optionnelle
            <img
              src={profile.avatarUrl}
              alt=""
              className="size-20 shrink-0 rounded-full object-cover ring-4 ring-sky-100 dark:ring-sky-900"
            />
          ) : (
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-[#10579F] text-2xl font-semibold text-white">
              {initials}
            </div>
          )}

          <div className="min-w-0 space-y-2">
            <div>
              <h2 className="text-xl font-semibold text-[#10579F] dark:text-sky-50">{displayName}</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">{profile.email}</p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
              <span className="rounded-full bg-sky-50 px-3 py-1 text-xs font-medium text-[#10579F] dark:bg-slate-800 dark:text-sky-200">
                {roleLabel}
              </span>
              <span
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-medium",
                  profile.twoFactorEnabled
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                )}
                data-testid="profile-2fa-status"
              >
                {profile.twoFactorEnabled ? "2FA activée" : "2FA désactivée"}
              </span>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">Membre depuis le {memberSince}</p>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold text-[#10579F] dark:text-sky-50">Paramètres du compte</h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {accountLinks.map((item) => {
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href}
                data-testid={item.testId}
                className={cn(
                  mbokaPanelClassName,
                  mbokaButtonOutlineClassName,
                  "h-auto min-h-11 flex-col items-start gap-3 p-4 text-left normal-case"
                )}
              >
                <span className="inline-flex items-center gap-2 text-sm font-semibold text-[#10579F] dark:text-sky-50">
                  <Icon className="size-4 shrink-0" aria-hidden="true" />
                  {item.label}
                </span>
                <span className="text-xs leading-5 font-normal text-slate-500 dark:text-slate-400">
                  {item.description}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
