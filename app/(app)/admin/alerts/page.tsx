import { AlertSettingsPanel } from "@/components/organisms/alert-settings-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requirePermission } from "@/lib/auth/session";
import { loadAlertSettingsRecord } from "@/lib/alerts/load-settings";
import { PERMISSIONS } from "@/lib/permissions";

export default async function AdminAlertsPage() {
  await requirePermission(PERMISSIONS.USERS_MANAGE);
  const settings = await loadAlertSettingsRecord();

  return (
    <div className="space-y-8">
      <MbokaPageHeader
        eyebrow="Administration"
        title="Alertes & webhooks"
        description="Configurez les canaux de notification et testez les intégrations Discord/Slack ou email."
      />

      <AlertSettingsPanel settings={settings} />
    </div>
  );
}
