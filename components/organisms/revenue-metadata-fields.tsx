"use client";

import type { RevenueCategory } from "@prisma/client";

import { MbokaSelect } from "@/components/molecules/mboka-select";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  MIX_SERVICE_TYPE_OPTIONS,
  STUDIO_ROOM_OPTIONS,
} from "@/lib/revenues/categories";
import { mbokaFieldClassName, mbokaLabelClassName } from "@/lib/design-tokens";

type RevenueMetadataFieldsProps = {
  category: RevenueCategory;
  serviceType: string;
  onServiceTypeChange: (value: string) => void;
  studioRoom: string;
  onStudioRoomChange: (value: string) => void;
  defaultSessionDate: string;
};

export function RevenueMetadataFields({
  category,
  serviceType,
  onServiceTypeChange,
  studioRoom,
  onStudioRoomChange,
  defaultSessionDate,
}: RevenueMetadataFieldsProps) {
  switch (category) {
    case "STUDIO_SESSION":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="metadataStudioRoom" className={mbokaLabelClassName}>
              Salle *
            </FieldLabel>
            <MbokaSelect
              id="metadataStudioRoom"
              name="metadataStudioRoom"
              value={studioRoom}
              onValueChange={onStudioRoomChange}
              options={STUDIO_ROOM_OPTIONS}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataSessionDate" className={mbokaLabelClassName}>
              Date de session *
            </FieldLabel>
            <Input
              id="metadataSessionDate"
              name="metadataSessionDate"
              type="date"
              required
              defaultValue={defaultSessionDate}
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataSessionStartTime" className={mbokaLabelClassName}>
              Heure de début
            </FieldLabel>
            <Input
              id="metadataSessionStartTime"
              name="metadataSessionStartTime"
              type="time"
              defaultValue="09:00"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataDurationHours" className={mbokaLabelClassName}>
              Durée (heures) *
            </FieldLabel>
            <Input
              id="metadataDurationHours"
              name="metadataDurationHours"
              type="number"
              min={0.5}
              step={0.5}
              required
              placeholder="Ex. 4"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="metadataSoundEngineer" className={mbokaLabelClassName}>
              Ingénieur du son
            </FieldLabel>
            <Input
              id="metadataSoundEngineer"
              name="metadataSoundEngineer"
              placeholder="Ex. Marc"
              className={mbokaFieldClassName}
            />
          </Field>
        </div>
      );

    case "SERVICES_MIX_MASTER":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="metadataServiceType" className={mbokaLabelClassName}>
              Type de prestation *
            </FieldLabel>
            <MbokaSelect
              id="metadataServiceType"
              name="metadataServiceType"
              value={serviceType}
              onValueChange={onServiceTypeChange}
              options={MIX_SERVICE_TYPE_OPTIONS}
              required
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataTrackCount" className={mbokaLabelClassName}>
              Nombre de pistes
            </FieldLabel>
            <Input
              id="metadataTrackCount"
              name="metadataTrackCount"
              type="number"
              min={1}
              step={1}
              placeholder="Ex. 12"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field className="sm:col-span-2">
            <FieldLabel htmlFor="metadataEngineer" className={mbokaLabelClassName}>
              Ingénieur
            </FieldLabel>
            <Input
              id="metadataEngineer"
              name="metadataEngineer"
              placeholder="Ex. Jean"
              className={mbokaFieldClassName}
            />
          </Field>
        </div>
      );

    case "LOCATION_VEHICULE":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="metadataVehiclePlate" className={mbokaLabelClassName}>
              Plaque *
            </FieldLabel>
            <Input
              id="metadataVehiclePlate"
              name="metadataVehiclePlate"
              required
              placeholder="Ex. 1234-AB"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataVehicleModel" className={mbokaLabelClassName}>
              Modèle
            </FieldLabel>
            <Input
              id="metadataVehicleModel"
              name="metadataVehicleModel"
              placeholder="Ex. Land Cruiser"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataRentalStartDate" className={mbokaLabelClassName}>
              Date de début *
            </FieldLabel>
            <Input
              id="metadataRentalStartDate"
              name="metadataRentalStartDate"
              type="date"
              required
              defaultValue={defaultSessionDate}
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataRentalStartTime" className={mbokaLabelClassName}>
              Heure de départ
            </FieldLabel>
            <Input
              id="metadataRentalStartTime"
              name="metadataRentalStartTime"
              type="time"
              defaultValue="08:00"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataDays" className={mbokaLabelClassName}>
              Nombre de jours *
            </FieldLabel>
            <Input
              id="metadataDays"
              name="metadataDays"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={1}
              className={mbokaFieldClassName}
            />
          </Field>

          <Field className="flex items-end">
            <label className="flex min-h-[48px] w-full items-center gap-3 rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-3 text-sm text-slate-700 dark:border-sky-900 dark:bg-slate-800/60 dark:text-slate-100">
              <input
                id="metadataDriverIncluded"
                name="metadataDriverIncluded"
                type="checkbox"
                className="size-4 rounded border-sky-200 text-[#10579F]"
              />
              Chauffeur inclus
            </label>
          </Field>
        </div>
      );

    case "VENTE_ANNEXE":
      return (
        <div className="grid gap-5 sm:grid-cols-2">
          <Field>
            <FieldLabel htmlFor="metadataProductName" className={mbokaLabelClassName}>
              Produit *
            </FieldLabel>
            <Input
              id="metadataProductName"
              name="metadataProductName"
              required
              placeholder="Ex. CD merch, casquette…"
              className={mbokaFieldClassName}
            />
          </Field>

          <Field>
            <FieldLabel htmlFor="metadataQuantity" className={mbokaLabelClassName}>
              Quantité *
            </FieldLabel>
            <Input
              id="metadataQuantity"
              name="metadataQuantity"
              type="number"
              min={1}
              step={1}
              required
              defaultValue={1}
              className={mbokaFieldClassName}
            />
          </Field>
        </div>
      );

    default:
      return null;
  }
}
