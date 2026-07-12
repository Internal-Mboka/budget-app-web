import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

try {
  const rows = await prisma.$queryRaw`
    SELECT "migration_name", "started_at", "finished_at", "rolled_back_at", "logs"
    FROM "_prisma_migrations"
    WHERE "migration_name" = '20260711123000_add_roles_and_unique_leadership'
    ORDER BY "started_at" DESC
    LIMIT 1;
  `;
  console.log(JSON.stringify(rows));
} catch (error) {
  console.error("MIG_LOG_ERROR", error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
