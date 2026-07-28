import type { RevenueCategory } from "@prisma/client";
import { z } from "zod";

import { enrichStudioMetadata, enrichVehicleMetadata } from "@/lib/revenues/booking";

const studioMetadataSchema = z.object({
  studioRoom: z.string().trim().min(1, "Salle requise."),
  durationHours: z.coerce.number().positive("Durée invalide."),
  sessionDate: z.string().trim().min(1, "Date de session requise."),
  sessionStartTime: z.string().trim().optional(),
  soundEngineer: z.string().trim().optional(),
});

const mixMetadataSchema = z.object({
  serviceType: z.enum(["MIX", "MASTER", "MIX_MASTER"]),
  trackCount: z.coerce.number().int().positive().optional(),
  engineer: z.string().trim().optional(),
});

const vehicleMetadataSchema = z.object({
  vehiclePlate: z.string().trim().min(2, "Plaque requise."),
  vehicleModel: z.string().trim().optional(),
  days: z.coerce.number().int().positive("Nombre de jours invalide."),
  rentalStartDate: z.string().trim().min(1, "Date de début requise."),
  rentalStartTime: z.string().trim().optional(),
  driverIncluded: z.coerce.boolean().default(false),
});

const annexMetadataSchema = z.object({
  productName: z.string().trim().min(1, "Produit requis."),
  quantity: z.coerce.number().int().positive().default(1),
});

export const revenueMetadataSchemas: Record<RevenueCategory, z.ZodTypeAny> = {
  STUDIO_SESSION: studioMetadataSchema,
  SERVICES_MIX_MASTER: mixMetadataSchema,
  LOCATION_VEHICULE: vehicleMetadataSchema,
  VENTE_ANNEXE: annexMetadataSchema,
};

export function parseRevenueMetadata(category: RevenueCategory, raw: unknown) {
  const schema = revenueMetadataSchemas[category];
  const parsed = schema.parse(raw);

  if (category === "STUDIO_SESSION") {
    const data = parsed as StudioRevenueMetadata;
    return enrichStudioMetadata(data, data.sessionDate, data.sessionStartTime);
  }

  if (category === "LOCATION_VEHICULE") {
    const data = parsed as VehicleRevenueMetadata;
    return enrichVehicleMetadata(data, data.rentalStartDate, data.rentalStartTime);
  }

  return parsed;
}

export type StudioRevenueMetadata = z.infer<typeof studioMetadataSchema>;
export type MixRevenueMetadata = z.infer<typeof mixMetadataSchema>;
export type VehicleRevenueMetadata = z.infer<typeof vehicleMetadataSchema>;
export type AnnexRevenueMetadata = z.infer<typeof annexMetadataSchema>;

export type RevenueMetadata =
  | StudioRevenueMetadata
  | MixRevenueMetadata
  | VehicleRevenueMetadata
  | AnnexRevenueMetadata;

export function buildMetadataFromFormData(formData: FormData, category: RevenueCategory) {
  switch (category) {
    case "STUDIO_SESSION":
      return {
        studioRoom: String(formData.get("metadataStudioRoom") ?? ""),
        durationHours: formData.get("metadataDurationHours"),
        sessionDate: String(formData.get("metadataSessionDate") ?? ""),
        sessionStartTime: String(formData.get("metadataSessionStartTime") ?? "") || undefined,
        soundEngineer: String(formData.get("metadataSoundEngineer") ?? "") || undefined,
      };
    case "SERVICES_MIX_MASTER":
      return {
        serviceType: String(formData.get("metadataServiceType") ?? ""),
        trackCount: formData.get("metadataTrackCount") || undefined,
        engineer: String(formData.get("metadataEngineer") ?? "") || undefined,
      };
    case "LOCATION_VEHICULE":
      return {
        vehiclePlate: String(formData.get("metadataVehiclePlate") ?? ""),
        vehicleModel: String(formData.get("metadataVehicleModel") ?? "") || undefined,
        days: formData.get("metadataDays"),
        rentalStartDate: String(formData.get("metadataRentalStartDate") ?? ""),
        rentalStartTime: String(formData.get("metadataRentalStartTime") ?? "") || undefined,
        driverIncluded: formData.get("metadataDriverIncluded") === "on",
      };
    case "VENTE_ANNEXE":
      return {
        productName: String(formData.get("metadataProductName") ?? ""),
        quantity: formData.get("metadataQuantity") || 1,
      };
    default:
      return {};
  }
}

export function getRevenueMetadataSummary(
  category: RevenueCategory,
  metadata: RevenueMetadata | null | undefined
): string {
  if (!metadata) {
    return "—";
  }

  switch (category) {
    case "STUDIO_SESSION": {
      const data = metadata as StudioRevenueMetadata & { sessionDate?: string; sessionStartTime?: string };
      const dateLabel = data.sessionDate ? ` · ${data.sessionDate}` : "";
      return `Salle ${data.studioRoom} · ${data.durationHours}h${dateLabel}`;
    }
    case "SERVICES_MIX_MASTER": {
      const data = metadata as MixRevenueMetadata;
      return `${data.serviceType}${data.trackCount ? ` · ${data.trackCount} pistes` : ""}`;
    }
    case "LOCATION_VEHICULE": {
      const data = metadata as VehicleRevenueMetadata & { rentalStartDate?: string };
      const dateLabel = data.rentalStartDate ? ` · dès ${data.rentalStartDate}` : "";
      return `${data.vehiclePlate} · ${data.days} j${dateLabel}`;
    }
    case "VENTE_ANNEXE": {
      const data = metadata as AnnexRevenueMetadata;
      return `${data.productName} × ${data.quantity}`;
    }
    default:
      return "—";
  }
}
