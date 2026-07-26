import type { ClientCategory } from "@prisma/client";

export const CLIENT_CATEGORY_OPTIONS: Array<{ value: ClientCategory; label: string }> = [
  { value: "ARTISTE_INDEPENDANT", label: "Artiste indépendant" },
  { value: "LABEL_MAISON_DE_DISQUE", label: "Label / Maison de disque" },
  { value: "ENTREPRISE_MARQUE", label: "Entreprise / Marque" },
  { value: "PARTICULIER_OCCASIONNEL", label: "Particulier" },
];

export const CLIENT_CATEGORY_LABELS: Record<ClientCategory, string> = {
  ARTISTE_INDEPENDANT: "Artiste indépendant",
  LABEL_MAISON_DE_DISQUE: "Label / Maison de disque",
  ENTREPRISE_MARQUE: "Entreprise / Marque",
  PARTICULIER_OCCASIONNEL: "Particulier",
};

export function getClientCategoryLabel(category: ClientCategory | string): string {
  return CLIENT_CATEGORY_LABELS[category as ClientCategory] ?? category;
}
