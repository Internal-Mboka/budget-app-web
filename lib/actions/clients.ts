"use server";

import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog, buildAuditChangeDetails } from "@/lib/audit";
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
import { mergeUniqueTags, removeTagFromList, tagsMatch } from "@/lib/clients/tags";
import { createClientSchema, updateClientSchema } from "@/lib/validations/client";
import {
  clientTagMutationSchema,
  clientTagRemovalSchema,
  MAX_CLIENT_TAGS,
} from "@/lib/validations/client-tags";

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

  const auditMeta = await captureAuditRequestContext();

  const created = await prisma.$transaction(async (tx) => {
    const client = await tx.client.create({
      data: {
        name,
        category,
        phone: phone ?? null,
        email: email?.toLowerCase() ?? null,
      },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
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

  const existingClient = await prisma.client.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      category: true,
      phone: true,
      email: true,
      address: true,
      notes: true,
    },
  });

  if (!existingClient) {
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

  const auditMeta = await captureAuditRequestContext();

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

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "CLIENT_UPDATED",
      entity: "Client",
      entityId: client.id,
      userId: session.user.id,
      details: buildAuditChangeDetails(
        {
          name: existingClient.name,
          category: existingClient.category,
          phone: existingClient.phone,
          email: existingClient.email,
          address: existingClient.address,
          notes: existingClient.notes,
        },
        {
          name: client.name,
          category: client.category,
          phone: client.phone,
          email: client.email,
          address: client.address,
          notes: client.notes,
        },
        session.user.email
      ),
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
  const auditMeta = await captureAuditRequestContext();

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

      await writeAuditLog({
        tx,
        requestMeta: auditMeta,
        captureRequest: false,
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

export type ClientTagsActionResult =
  | { success: true; tags: string[] }
  | { success: false; error: string };

async function requireClientTagsPermission() {
  return requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);
}

export async function addClientTagAction(formData: FormData): Promise<ClientTagsActionResult> {
  const session = await requireClientTagsPermission();

  const parsed = clientTagMutationSchema.safeParse({
    clientId: formData.get("clientId"),
    tag: formData.get("tag"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { clientId, tag } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, tags: true },
  });

  if (!client) {
    return { success: false, error: "Client introuvable." };
  }

  if (client.tags.length >= MAX_CLIENT_TAGS) {
    return { success: false, error: `Maximum ${MAX_CLIENT_TAGS} tags par client.` };
  }

  if (client.tags.some((existingTag) => tagsMatch(existingTag, tag))) {
    return { success: false, error: "Ce tag est déjà associé au client." };
  }

  const nextTags = mergeUniqueTags(client.tags, tag);

  const auditMeta = await captureAuditRequestContext();

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.client.update({
      where: { id: clientId },
      data: { tags: nextTags },
      select: { tags: true },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "CLIENT_TAG_ADDED",
      entity: "Client",
      entityId: clientId,
      userId: session.user.id,
      details: {
        ...buildAuditChangeDetails({ tags: client.tags }, { tags: nextTags }),
        clientName: client.name,
        tag,
        performedBy: session.user.email,
      },
    });

    return saved;
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  return { success: true, tags: updated.tags };
}

export async function removeClientTagAction(formData: FormData): Promise<ClientTagsActionResult> {
  const session = await requireClientTagsPermission();

  const parsed = clientTagRemovalSchema.safeParse({
    clientId: formData.get("clientId"),
    tag: formData.get("tag"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { clientId, tag } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true, tags: true },
  });

  if (!client) {
    return { success: false, error: "Client introuvable." };
  }

  const nextTags = removeTagFromList(client.tags, tag);

  if (nextTags.length === client.tags.length) {
    return { success: false, error: "Tag introuvable sur ce client." };
  }

  const auditMeta = await captureAuditRequestContext();

  const updated = await prisma.$transaction(async (tx) => {
    const saved = await tx.client.update({
      where: { id: clientId },
      data: { tags: nextTags },
      select: { tags: true },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "CLIENT_TAG_REMOVED",
      entity: "Client",
      entityId: clientId,
      userId: session.user.id,
      details: {
        ...buildAuditChangeDetails({ tags: client.tags }, { tags: nextTags }),
        clientName: client.name,
        tag,
        performedBy: session.user.email,
      },
    });

    return saved;
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  return { success: true, tags: updated.tags };
}
