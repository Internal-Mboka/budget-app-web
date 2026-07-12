import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL missing");
}

const adapter = new PrismaNeon({ connectionString });
const prisma = new PrismaClient({ adapter, log: ["error"] });

try {
  const userCount = await prisma.user.count();
  console.log(`user_count=${userCount}`);
} catch (error) {
  console.error("PRISMA_TEST_ERROR");
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
