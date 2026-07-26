import { prisma } from "@/lib/prisma";

export async function generateTransactionCode(referenceDate = new Date()): Promise<string> {
  const year = referenceDate.getFullYear();
  const prefix = `TR-${year}-`;

  const latest = await prisma.transaction.findFirst({
    where: {
      code: {
        startsWith: prefix,
      },
    },
    orderBy: {
      code: "desc",
    },
    select: {
      code: true,
    },
  });

  const lastSequence = latest ? Number.parseInt(latest.code.slice(prefix.length), 10) : 0;
  const nextSequence = Number.isFinite(lastSequence) ? lastSequence + 1 : 1;

  return `${prefix}${String(nextSequence).padStart(4, "0")}`;
}
