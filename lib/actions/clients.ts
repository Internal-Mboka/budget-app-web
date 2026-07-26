"use server";

import { revalidatePath } from "next/cache";

import { requirePermission } from "@/lib/auth/session";
import { prisma } from "@/lib/prisma";
import { PERMISSIONS } from "@/lib/permissions";
import { createClientSchema } from "@/lib/validations/client";

export type ClientActionResult =
  | {
      success: true;
      client: {
        id: string;
        name: string;
        category: string;
        phone: string | null;
        email: string | null;
      };
    }
  | { success: false; error: string };

function normalizePhone(phone: string) {
  return phone.replace(/\s+/g, "").trim();
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

  const duplicateByName = await prisma.client.findFirst({
    where: {
      name: {
        equals: name,
        mode: "insensitive",
      },
    },
    select: { id: true, name: true },
  });

  if (duplicateByName) {
    return {
      success: false,
      error: `Un client nommé « ${duplicateByName.name} » existe déjà.`,
    };
  }

  if (phone) {
    const normalizedPhone = normalizePhone(phone);
    const clientsWithPhone = await prisma.client.findMany({
      where: { phone: { not: null } },
      select: { id: true, phone: true },
    });

    const duplicateByPhone = clientsWithPhone.find(
      (client) => client.phone && normalizePhone(client.phone) === normalizedPhone
    );

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
