export type DashboardOfflineSnapshot = {
  version: 1;
  savedAt: string;
  path: string;
  periodLabel: string;
  kpis: {
    revenueTotal: number;
    expenseTotal: number;
    netTreasury: number;
    receivables: number;
    cashCollections: number;
  };
  overdueCount: number;
  fiscalPeriodLabel: string | null;
};

const STORAGE_KEY = "mboka-offline-dashboard-snapshot";

export function saveDashboardOfflineSnapshot(snapshot: DashboardOfflineSnapshot): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch (error) {
    console.warn("[pwa:offline-snapshot] save failed", error);
  }
}

export function loadDashboardOfflineSnapshot(): DashboardOfflineSnapshot | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);

    if (!raw) {
      return null;
    }

    const parsed = JSON.parse(raw) as DashboardOfflineSnapshot;

    if (parsed.version !== 1 || !parsed.savedAt || !parsed.kpis) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function formatOfflineSnapshotAge(savedAt: string): string {
  const savedTime = new Date(savedAt).getTime();

  if (!Number.isFinite(savedTime)) {
    return "récemment";
  }

  const diffMinutes = Math.max(0, Math.round((Date.now() - savedTime) / 60_000));

  if (diffMinutes < 1) {
    return "à l'instant";
  }

  if (diffMinutes < 60) {
    return `il y a ${diffMinutes} min`;
  }

  const diffHours = Math.round(diffMinutes / 60);

  if (diffHours < 24) {
    return `il y a ${diffHours} h`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `il y a ${diffDays} j`;
}
