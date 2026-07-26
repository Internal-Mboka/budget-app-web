import type { RevenueCategory } from "@prisma/client";

export const REVENUE_CATEGORY_OPTIONS: Array<{ value: RevenueCategory; label: string }> = [
  { value: "STUDIO_SESSION", label: "Session studio" },
  { value: "SERVICES_MIX_MASTER", label: "Mix / Master" },
  { value: "LOCATION_VEHICULE", label: "Location véhicule" },
  { value: "VENTE_ANNEXE", label: "Vente annexe" },
];

export const REVENUE_CATEGORY_LABELS: Record<RevenueCategory, string> = {
  STUDIO_SESSION: "Session studio",
  SERVICES_MIX_MASTER: "Mix / Master",
  LOCATION_VEHICULE: "Location véhicule",
  VENTE_ANNEXE: "Vente annexe",
};

export function getRevenueCategoryLabel(category: RevenueCategory | string): string {
  return REVENUE_CATEGORY_LABELS[category as RevenueCategory] ?? category;
}

export const STUDIO_ROOM_OPTIONS = [
  { value: "A", label: "Salle A" },
  { value: "B", label: "Salle B" },
  { value: "C", label: "Salle C" },
  { value: "MAIN", label: "Salle principale" },
];

export const MIX_SERVICE_TYPE_OPTIONS = [
  { value: "MIX", label: "Mix" },
  { value: "MASTER", label: "Master" },
  { value: "MIX_MASTER", label: "Mix & Master" },
];
