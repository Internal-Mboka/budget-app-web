"use server";

import { revalidatePath } from "next/cache";

import { captureAuditRequestContext, writeAuditLog } from "@/lib/audit";
import { requirePermission } from "@/lib/auth/session";
import { buildPaginationMeta, parsePagination } from "@/lib/pagination";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { clientNoteSchema } from "@/lib/validations/client-interactions";

export type ClientNoteItem = {
  id: string;
  content: string;
  createdAt: string;
  author: {
    id: string;
    name: string;
    email: string;
  };
};

export type ClientNotesResult = {
  notes: ClientNoteItem[];
  pagination: ReturnType<typeof buildPaginationMeta>;
};

export type ClientNoteActionResult =
  | { success: true; note: ClientNoteItem }
  | { success: false; error: string };

function mapClientNote(note: {
  id: string;
  content: string;
  createdAt: Date;
  author: { id: string; firstName: string; lastName: string; email: string };
}): ClientNoteItem {
  return {
    id: note.id,
    content: note.content,
    createdAt: note.createdAt.toISOString(),
    author: {
      id: note.author.id,
      name: `${note.author.firstName} ${note.author.lastName}`.trim(),
      email: note.author.email,
    },
  };
}

export async function getClientNotesAction(
  clientId: string,
  page = 1,
  pageSize = 10
): Promise<ClientNotesResult> {
  await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const pagination = parsePagination({ page, pageSize });

  const [total, notes] = await Promise.all([
    prisma.clientNote.count({ where: { clientId } }),
    prisma.clientNote.findMany({
      where: { clientId },
      orderBy: { createdAt: "desc" },
      skip: pagination.skip,
      take: pagination.take,
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    }),
  ]);

  return {
    notes: notes.map(mapClientNote),
    pagination: buildPaginationMeta(total, pagination.page, pagination.pageSize),
  };
}

export async function addClientNoteAction(formData: FormData): Promise<ClientNoteActionResult> {
  const session = await requirePermission(PERMISSIONS.FINANCE_CREATE_REVENUE);

  const parsed = clientNoteSchema.safeParse({
    clientId: formData.get("clientId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Données invalides." };
  }

  const { clientId, content } = parsed.data;

  const client = await prisma.client.findUnique({
    where: { id: clientId },
    select: { id: true, name: true },
  });

  if (!client) {
    return { success: false, error: "Client introuvable." };
  }

  const auditMeta = await captureAuditRequestContext();

  const created = await prisma.$transaction(async (tx) => {
    const note = await tx.clientNote.create({
      data: {
        clientId,
        content,
        authorId: session.user.id,
      },
      select: {
        id: true,
        content: true,
        createdAt: true,
        author: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    await writeAuditLog({
      tx,
      requestMeta: auditMeta,
      captureRequest: false,
      action: "CLIENT_NOTE_ADDED",
      entity: "Client",
      entityId: clientId,
      userId: session.user.id,
      details: {
        clientName: client.name,
        notePreview: content.slice(0, 120),
        performedBy: session.user.email,
      },
    });

    return note;
  });

  revalidatePath("/clients");
  revalidatePath(`/clients/${clientId}`);

  return { success: true, note: mapClientNote(created) };
}
