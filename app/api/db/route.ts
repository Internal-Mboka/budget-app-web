export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return Response.json(
      {
        ok: false,
        message: "DATABASE_URL non configuree",
      },
      { status: 503 }
    );
  }

  try {
    const { prisma } = await import("@/lib/prisma");

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
