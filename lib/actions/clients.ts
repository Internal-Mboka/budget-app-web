"use server";

import { revalidatePath } from "next/cache";

import { requirePermission, requireSession, hasAnyPermission } from "@/lib/auth/session";
import { parseClientsImportCsv } from "@/lib/clients/import";
import {
  buildClientSearchWhere,
  CLIENT_SEARCH_LIMIT,
  CLIENT_SEARCH_MIN_LENGTH,
  type ClientSearchResult,
} from "@/lib/clients/search";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";

export type ClientActionResult =
  | {
      success: true;
      client: {
        id: string;
        name: string;
        category: string;
        phone: string | null;
        email: string | null;
        address?: string | null;
        notes?: string | null;
      };
    }
  | { success: false; error: string };

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
}

async function findDuplicateClientByName(name: string, excludeClientId?: string) {
  const duplicate = await prisma.client.findFirst({
    where: {
      name: { equals: name, mode: "insensitive" },
      ...(excludeClientId ? { id: { not: excludeClientId } } : {}),
    },
    select: { id: true, name: true },
  });

  return duplicate;
}

async function findDuplicateClientByPhone(phone: string, excludeClientId?: string) {
  const normalizedPhone = normalizePhone(phone);
  const clientsWithPhone = await prisma.client.findMany({
    where: {
      phone: { not: null },
      ...(excludeClientId ? { id: { not: excludeClientId } } : {}),
    },
    select: { id: true, phone: true },
  });

  return clientsWithPhone.find(
    (client) => client.phone && normalizePhone(client.phone) === normalizedPhone
  );
}

export async function createClientAction(formData: FormData): Promise<ClientActionResult> {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const parsed = createClientSchema.safeParse({
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { name, category, phone, email } = parsed.data;

  const duplicateByName = await findDuplicateClientByName(name);

  if (duplicateByName) {
    return {
      success: false,
      error: `Un client nommé « ${duplicateByName.name} » existe déjà.`,
    };
  }

  if (phone) {
    const duplicateByPhone = await findDuplicateClientByPhone(phone);

    if (duplicateByPhone) {
      return {
        success: false,
        error: "Un client avec ce numéro de téléphone existe déjà.",
      };
    }
  }

  const created = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name,
        category,
        phone: phone ?? null,
        email: email?.toLowerCase() ?? null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CLIENT_CREATED",
        entity: "Client",
        entityId: client.id,
        userId: session.user.id,
        details: {
          name: client.name,
          category: client.category,
          phone: client.phone,
          email: client.email,
          performedBy: session.user.email,
        },
      },
    });

    return client;
  });

  revalidatePath("/clients");

  return {
    success: true,
    client: {
      id: created.id,
      name: created.name,
      category: created.category,
      phone: created.phone,
      email: created.email,
    },
  };
}

export async function searchClientsAction(query: string): Promise<ClientSearchResult[]> {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const term = query.trim();
  if (term.length < CLIENT_SEARCH_MIN_LENGTH) {
    return [];
  }

  const clients = await prisma.client.findMany({
    where: buildClientSearchWhere(term),
    take: CLIENT_SEARCH_LIMIT,
    orderBy: [{ name: "asc" }],
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      email: true,
    },
  });

  return clients;
}

export async function updateClientAction(formData: FormData): Promise<ClientActionResult> {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const parsed = updateClientSchema.safeParse({
    id: formData.get("id"),
    name: formData.get("name"),
    category: formData.get("category"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    address: formData.get("address"),
    notes: formData.get("notes"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides" };
  }

  const { id, name, category, phone, email, address, notes } = parsed.data;

  const existing = await prisma.client.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!existing) {
    return { success: false, error: "Client introuvable." };
  }

  const duplicateByName = await findDuplicateClientByName(name, id);

  if (duplicateByName) {
    return {
      success: false,
      error: `Un client nommé « ${duplicateByName.name} » existe déjà.`,
    };
  }

  if (phone) {
    const duplicateByPhone = await findDuplicateClientByPhone(phone, id);

    if (duplicateByPhone) {
      return {
        success: false,
        error: "Un client avec ce numéro de téléphone existe déjà.",
      };
    }
  }

  const updated = await prisma.$transaction(async (tx) => {
    const client = await tx.client.update({
      where: { id },
      data: {
        name,
        category,
        phone: phone ?? null,
        email: email?.toLowerCase() ?? null,
        address: address || null,
        notes: notes || null,
      },
    });

    await tx.auditLog.create({
      data: {
        action: "CLIENT_UPDATED",
        entity: "Client",
        entityId: client.id,
        userId: session.user.id,
        details: {
          name: client.name,
          category: client.category,
          phone: client.phone,
          email: client.email,
          address: client.address,
          notes: client.notes,
          performedBy: session.user.email,
        },
      },
    });

    return client;
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${id}`);

  return {
    success: true,
    client: {
      id: updated.id,
      name: updated.name,
      category: updated.category,
      phone: updated.phone,
      email: updated.email,
      address: updated.address,
      notes: updated.notes,
    },
  };
}

export type ImportClientsActionResult = {
  success: boolean;
  created: number;
  skipped: number;
  errors: string[];
  error?: string;
};

async function requireClientImportExportPermission() {
  const session = await requireSession();

  if (
    !hasAnyPermission(session.user.permissions, [
      PERMISSIONS.DASHBOARD_FULL,
      PERMISSIONS.DASHBOARD_FINANCIAL,
    ])
  ) {
    throw new Error("forbidden");
  }

  return session;
}

export async function importClientsAction(formData: FormData): Promise<ImportClientsActionResult> {
  let session;

  try {
    session = await requireClientImportExportPermission();
  } catch {
    return {
      success: false,
      created: 0,
      skipped: 0,
      errors: [],
      error: "Vous n'avez pas la permission d'importer des clients.",
    };
  }

  const file = formData.get("file");

  if (!(file instanceof File) || file.size === 0) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      errors: [],
      error: "Veuillez sélectionner un fichier CSV.",
    };
  }

  const content = await file.text();
  const { rows, errors } = parseClientsImportCsv(content);

  if (rows.length === 0) {
    return {
      success: false,
      created: 0,
      skipped: 0,
      errors,
      error: errors[0] ?? "Le fichier CSV est invalide ou vide.",
    };
  }

  let created = 0;
  let skipped = 0;
  const importErrors = [...errors];

  for (const row of rows) {
    const duplicateByName = await findDuplicateClientByName(row.name);

    if (duplicateByName) {
      skipped += 1;
      importErrors.push(`Ignoré « ${row.name} » : un client avec ce nom existe déjà.`);
      continue;
    }

    if (row.phone) {
      const duplicateByPhone = await findDuplicateClientByPhone(row.phone);

      if (duplicateByPhone) {
        skipped += 1;
        importErrors.push(`Ignoré « ${row.name} » : téléphone déjà utilisé.`);
        continue;
      }
    }

    await prisma.$transaction(async (tx) => {
      const client = await tx.client.create({
        data: {
          name: row.name,
          category: row.category,
          phone: row.phone ?? null,
          email: row.email ?? null,
          address: row.address ?? null,
          notes: row.notes ?? null,
        },
      });

      await tx.auditLog.create({
        data: {
          action: "CLIENT_IMPORTED",
          entity: "Client",
          entityId: client.id,
          userId: session.user.id,
          details: {
            name: client.name,
            category: client.category,
            performedBy: session.user.email,
            source: "csv-import",
          },
        },
      });
    });

    created += 1;
  }

  revalidatePath("/clients");

  return {
    success: created > 0,
    created,
    skipped,
    errors: importErrors,
    error: created === 0 ? "Aucun client importé." : undefined,
  };
}
