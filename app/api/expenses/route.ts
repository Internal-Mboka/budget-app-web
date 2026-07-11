import { Prisma } from "@prisma/client";
import { z } from "zod";

import { prisma } from "@/lib/prisma";

const createExpenseSchema = z.object({
  title: z.string().trim().min(1, "Le titre est requis"),
  amount: z.coerce.number().positive("Le montant doit etre positif"),
  type: z.enum(["ENTREE", "SORTIE"]),
  category: z.string().trim().max(80).optional(),
  spentAt: z.coerce.date().optional(),
});

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    const parsedQuery = querySchema.safeParse({
      page: searchParams.get("page") ?? "1",
      limit: searchParams.get("limit") ?? "10",
    });

    if (!parsedQuery.success) {
      return Response.json(
        {
          ok: false,
          message: "Parametres de pagination invalides",
          errors: parsedQuery.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { page, limit } = parsedQuery.data;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.expense.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.expense.count(),
    ]);

    return Response.json(
      {
        ok: true,
        message: "Depenses recuperees avec succes",
        data: items,
        meta: {
          page,
          limit,
          total,
          totalPages: Math.max(1, Math.ceil(total / limit)),
        },
      },
      { status: 200 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne serveur";

    return Response.json(
      {
        ok: false,
        message: "Erreur interne serveur",
        error: message,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const parsedBody = createExpenseSchema.safeParse(payload);

    if (!parsedBody.success) {
      return Response.json(
        {
          ok: false,
          message: "Donnees invalides",
          errors: parsedBody.error.flatten(),
        },
        { status: 400 }
      );
    }

    const { title, amount, type, category, spentAt } = parsedBody.data;

    const expense = await prisma.expense.create({
      data: {
        title,
        amount: new Prisma.Decimal(amount),
        type,
        categoryName: category,
        spentAt,
      },
    });

    return Response.json(
      {
        ok: true,
        message: "Depense creee avec succes",
        data: expense,
      },
      { status: 201 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur interne serveur";

    return Response.json(
      {
        ok: false,
        message: "Erreur interne serveur",
        error: message,
      },
      { status: 500 }
    );
  }
}
