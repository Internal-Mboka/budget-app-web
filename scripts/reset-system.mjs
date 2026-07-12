import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL missing");
}

const prisma = new PrismaClient({
  adapter: new PrismaNeon({ connectionString }),
  log: ["error"],
});

async function main() {
  if (process.env.ALLOW_RESET !== "YES") {
    console.error("Reset bloque. Definis ALLOW_RESET=YES pour confirmer.");
    process.exit(1);
  }

  await prisma.$transaction([
    prisma.expense.deleteMany(),
    prisma.category.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  console.log("Reset termine: users, categories et expenses supprimes.");
}

main()
  .catch((error) => {
    console.error("Echec reset", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
