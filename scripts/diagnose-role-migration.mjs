import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

try {
  const roles = await prisma.$queryRaw`
    SELECT "role", COUNT(*)::int AS "count"
    FROM "User"
    GROUP BY "role"
    ORDER BY "role";
  `;

  const leadershipDuplicates = await prisma.$queryRaw`
    SELECT "role", COUNT(*)::int AS "count"
    FROM "User"
    WHERE "role" IN ('PDG', 'COMPTABLE', 'DG', 'DIRECTEUR_TECHNIQUE')
    GROUP BY "role"
    HAVING COUNT(*) > 1;
  `;

  console.log("roles=", JSON.stringify(roles));
  console.log("leadership_duplicates=", JSON.stringify(leadershipDuplicates));
} catch (error) {
  console.error("DIAG_ERROR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
