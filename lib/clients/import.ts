import type { ClientCategory } from "@prisma/client";
import Papa from "papaparse";
import { z } from "zod";

import { CLIENT_CATEGORY_LABELS, CLIENT_CATEGORY_OPTIONS } from "@/lib/clients/categories";

const categoryByLabel = new Map(
  CLIENT_CATEGORY_OPTIONS.map((option) => [option.label.toLowerCase(), option.value])
);

const categoryByEnum = new Map(
  CLIENT_CATEGORY_OPTIONS.map((option) => [option.value.toLowerCase(), option.value])
);

export const clientImportRowSchema = z.object({
  name: z.string().trim().min(2, "Le nom doit contenir au moins 2 caractères."),
  category: z.string().trim().min(1, "La catégorie est obligatoire."),
  phone: z.string().trim().optional(),
  email: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || z.string().email().safeParse(value).success, {
      message: "Adresse email invalide.",
    }),
  address: z.string().trim().optional(),
  notes: z.string().trim().optional(),
});

export type ClientImportRow = z.infer<typeof clientImportRowSchema> & {
  category: ClientCategory;
};

const HEADER_ALIASES: Record<string, keyof z.infer<typeof clientImportRowSchema>> = {
  nom: "name",
  name: "name",
  categorie: "category",
  catégorie: "category",
  category: "category",
  telephone: "phone",
  téléphone: "phone",
  phone: "phone",
  email: "email",
  adresse: "address",
  address: "address",
  notes: "notes",
};

function normalizeHeader(header: string) {
  return header
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function mapRecord(record: Record<string, unknown>) {
  const mapped: Record<string, string> = {};

  for (const [rawKey, rawValue] of Object.entries(record)) {
    const key = HEADER_ALIASES[normalizeHeader(rawKey)];
    if (!key) {
      continue;
    }

    mapped[key] = String(rawValue ?? "").trim();
  }

  return mapped;
}

export function resolveImportCategory(value: string): ClientCategory | null {
  const normalized = value.trim().toLowerCase();
  const fromLabel = categoryByLabel.get(normalized);

  if (fromLabel) {
    return fromLabel;
  }

  const enumCandidate = normalized.replace(/\s+/g, "_").toUpperCase();

  if (enumCandidate in CLIENT_CATEGORY_LABELS) {
    return enumCandidate as ClientCategory;
  }

  return categoryByEnum.get(normalized.replace(/\s+/g, "_")) ?? null;
}

export function parseClientsImportCsv(content: string) {
  const normalizedContent = content.replace(/^\uFEFF/, "");
  const parsed = Papa.parse<Record<string, unknown>>(normalizedContent, {
    header: true,
    skipEmptyLines: true,
    delimiter: normalizedContent.includes(";") ? ";" : ",",
  });

  if (parsed.errors.length > 0) {
    return {
      rows: [] as ClientImportRow[],
      errors: parsed.errors.map((error) => `Ligne ${(error.row ?? 0) + 1} : ${error.message}`),
    };
  }

  const rows: ClientImportRow[] = [];
  const errors: string[] = [];

  parsed.data.forEach((record, index) => {
    const mapped = mapRecord(record);
    const validation = clientImportRowSchema.safeParse(mapped);

    if (!validation.success) {
      errors.push(`Ligne ${index + 2} : ${validation.error.issues[0]?.message ?? "Données invalides"}`);
      return;
    }

    const category = resolveImportCategory(validation.data.category);

    if (!category) {
      errors.push(`Ligne ${index + 2} : catégorie « ${validation.data.category} » inconnue.`);
      return;
    }

    rows.push({
      ...validation.data,
      category,
      phone: validation.data.phone || undefined,
      email: validation.data.email?.toLowerCase() || undefined,
      address: validation.data.address || undefined,
      notes: validation.data.notes || undefined,
    });
  });

  if (rows.length === 0 && errors.length === 0) {
    errors.push("Le fichier ne contient aucune ligne importable.");
  }

  return { rows, errors };
}
