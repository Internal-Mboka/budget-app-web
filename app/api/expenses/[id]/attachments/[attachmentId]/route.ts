import { NextResponse } from "next/server";

import { getSession } from "@/lib/auth/get-session";
import { hasPermission } from "@/lib/auth/session";
import { getExpenseAttachments } from "@/lib/expenses/attachments";
import { PERMISSIONS } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { readExpenseAttachmentFile } from "@/lib/storage/expense-attachments";

type RouteContext = {
  params: Promise<{ id: string; attachmentId: string }>;
};

export async function GET(_request: Request, context: RouteContext) {
  const session = await getSession();

  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié." }, { status: 401 });
  }

  if (!hasPermission(session.user.permissions, PERMISSIONS.FINANCE_CREATE_EXPENSE)) {
    return NextResponse.json({ error: "Permission insuffisante." }, { status: 403 });
  }

  const { id, attachmentId } = await context.params;

  const expense = await prisma.transaction.findFirst({
    where: { id, type: "EXPENSE" },
    select: {
      id: true,
      metadata: true,
    },
  });

  if (!expense) {
    return NextResponse.json({ error: "Dépense introuvable." }, { status: 404 });
  }

  const attachment = getExpenseAttachments(expense.metadata).find((entry) => entry.id === attachmentId);

  if (!attachment) {
    return NextResponse.json({ error: "Pièce justificative introuvable." }, { status: 404 });
  }

  try {
    const bytes = await readExpenseAttachmentFile({
      transactionId: expense.id,
      attachmentId: attachment.id,
      fileName: attachment.fileName,
    });

    return new NextResponse(new Uint8Array(bytes), {
      status: 200,
      headers: {
        "Content-Type": attachment.mimeType,
        "Content-Disposition": `inline; filename="${attachment.fileName.replace(/"/g, "")}"`,
        "Cache-Control": "private, max-age=3600",
      },
    });
  } catch (error) {
    console.error("GET expense attachment failed", error);
    return NextResponse.json({ error: "Fichier introuvable sur le serveur." }, { status: 404 });
  }
}
