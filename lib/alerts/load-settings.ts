import type { CriticalAlertType } from "@/lib/alerts/config";
import {
  areCriticalAlertsEnabled,
  getAlertWebhookSecret,
  getAlertWebhookUrl,
  getHighValueAdjustmentThreshold,
} from "@/lib/alerts/config";
import { prisma } from "@/lib/prisma";
import { decimalToNumber } from "@/lib/transactions/decimal";

export type AlertRuntimeConfig = {
  alertsEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  adjustmentThresholdUsd: number;
  disabledAlertTypes: CriticalAlertType[];
  emailProviderConfigured: boolean;
};

export type AlertSettingsRecord = {
  alertsEnabled: boolean;
  emailEnabled: boolean;
  webhookEnabled: boolean;
  webhookUrl: string | null;
  webhookSecret: string | null;
  adjustmentThresholdUsd: number | null;
  disabledAlertTypes: CriticalAlertType[];
  updatedAt: string;
  updatedByUserId: string | null;
  webhookSecretConfigured: boolean;
  emailProviderConfigured: boolean;
  envFallbackActive: boolean;
};

const ALL_ALERT_TYPES: CriticalAlertType[] = [
  "CASH_CLOSING_DISCREPANCY",
  "EXPENSE_THRESHOLD_EXCEEDED",
  "HIGH_VALUE_ADJUSTMENT",
  "FISCAL_PERIOD_CLOSING_PENDING",
  "FISCAL_PERIOD_CLOSING_ACCOUNTANT_VISA",
  "FISCAL_PERIOD_CLOSING_APPROVED",
  "FISCAL_PERIOD_OPENED",
];

function parseDisabledAlertTypes(value: unknown): CriticalAlertType[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value.filter((entry): entry is CriticalAlertType =>
    ALL_ALERT_TYPES.includes(entry as CriticalAlertType)
  );
}

function isEmailProviderConfigured(): boolean {
  return Boolean(process.env.BREVO_API_KEY?.trim());
}

export async function loadAlertRuntimeConfig(): Promise<AlertRuntimeConfig> {
  const row = await prisma.alertSettings.findUnique({ where: { id: "default" } });

  const envWebhookUrl = getAlertWebhookUrl();
  const envWebhookSecret = getAlertWebhookSecret();

  if (!row) {
    return {
      alertsEnabled: areCriticalAlertsEnabled(),
      emailEnabled: true,
      webhookEnabled: true,
      webhookUrl: envWebhookUrl,
      webhookSecret: envWebhookSecret,
      adjustmentThresholdUsd: getHighValueAdjustmentThreshold(),
      disabledAlertTypes: [],
      emailProviderConfigured: isEmailProviderConfigured(),
    };
  }

  const dbThreshold =
    row.adjustmentThresholdUsd === null ? null : decimalToNumber(row.adjustmentThresholdUsd);

  return {
    alertsEnabled: row.alertsEnabled,
    emailEnabled: row.emailEnabled,
    webhookEnabled: row.webhookEnabled,
    webhookUrl: row.webhookUrl?.trim() || envWebhookUrl,
    webhookSecret: row.webhookSecret?.trim() || envWebhookSecret,
    adjustmentThresholdUsd: dbThreshold ?? getHighValueAdjustmentThreshold(),
    disabledAlertTypes: parseDisabledAlertTypes(row.disabledAlertTypes),
    emailProviderConfigured: isEmailProviderConfigured(),
  };
}

export async function loadAlertSettingsRecord(): Promise<AlertSettingsRecord> {
  const row = await prisma.alertSettings.findUnique({ where: { id: "default" } });
  const envWebhookUrl = getAlertWebhookUrl();
  const envWebhookSecret = getAlertWebhookSecret();

  if (!row) {
    return {
      alertsEnabled: areCriticalAlertsEnabled(),
      emailEnabled: true,
      webhookEnabled: true,
      webhookUrl: envWebhookUrl,
      webhookSecret: null,
      adjustmentThresholdUsd: getHighValueAdjustmentThreshold(),
      disabledAlertTypes: [],
      updatedAt: new Date().toISOString(),
      updatedByUserId: null,
      webhookSecretConfigured: Boolean(envWebhookSecret),
      emailProviderConfigured: isEmailProviderConfigured(),
      envFallbackActive: true,
    };
  }

  const dbThreshold =
    row.adjustmentThresholdUsd === null ? null : decimalToNumber(row.adjustmentThresholdUsd);

  const effectiveWebhookUrl = row.webhookUrl?.trim() || envWebhookUrl;
  const secretConfigured = Boolean(row.webhookSecret?.trim() || envWebhookSecret);

  return {
    alertsEnabled: row.alertsEnabled,
    emailEnabled: row.emailEnabled,
    webhookEnabled: row.webhookEnabled,
    webhookUrl: effectiveWebhookUrl,
    webhookSecret: null,
    adjustmentThresholdUsd: dbThreshold,
    disabledAlertTypes: parseDisabledAlertTypes(row.disabledAlertTypes),
    updatedAt: row.updatedAt.toISOString(),
    updatedByUserId: row.updatedByUserId,
    webhookSecretConfigured: secretConfigured,
    emailProviderConfigured: isEmailProviderConfigured(),
    envFallbackActive: !row.webhookUrl?.trim() && Boolean(envWebhookUrl),
  };
}

export async function getHighValueAdjustmentThresholdAsync(): Promise<number> {
  const config = await loadAlertRuntimeConfig();
  return config.adjustmentThresholdUsd;
}

export function maskWebhookSecretConfigured(configured: boolean): string {
  return configured ? "Secret configuré" : "Non configuré";
}
