import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;

    const totalExpenses = await prisma.expense.count();

    return Response.json({
      ok: true,
      message: "Connexion Neon OK",
      totalExpenses,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erreur inconnue";

    return Response.json(
      {
        ok: false,
        message: "Connexion Neon KO",
        error: message,
      },
      { status: 500 }
    );
  }
}
