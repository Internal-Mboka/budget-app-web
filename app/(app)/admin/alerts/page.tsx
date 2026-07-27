import { AlertSettingsPanel } from "@/components/organisms/alert-settings-panel";
import { MbokaPageHeader } from "@/components/molecules/mboka-page-header";
import { requireAlertSettingsAccess } from "@/lib/alerts/access";
import { loadAlertSettingsRecord } from "@/lib/alerts/load-settings";

export default async function AdminAlertsPage() {
  await requireAlertSettingsAccess();
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
