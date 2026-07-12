import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

try {
  const updated = await prisma.$executeRaw`
    WITH ranked AS (
      SELECT
        "id",
        "role",
        ROW_NUMBER() OVER (
          PARTITION BY "role"
          ORDER BY "createdAt" ASC, "id" ASC
        ) AS rn
      FROM "User"
      WHERE "role" IN ('PDG', 'COMPTABLE', 'DG', 'DIRECTEUR_TECHNIQUE')
    )
    UPDATE "User" u
    SET "role" = 'OBSERVATEUR',
        "updatedAt" = NOW()
    FROM ranked r
    WHERE u."id" = r."id"
      AND r.rn > 1;
  `;

  console.log(`updated_rows=${updated}`);
} catch (error) {
  console.error("FIX_DUPLICATES_ERROR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
