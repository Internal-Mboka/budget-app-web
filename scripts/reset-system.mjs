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

  try {
    await prisma.$transaction([
      prisma.expense.deleteMany(),
      prisma.category.deleteMany(),
      prisma.user.deleteMany(),
    ]);
  } catch (error) {
    const prismaCode = error && typeof error === "object" ? error.code : undefined;

    if (prismaCode !== "P2028") {
      throw error;
    }

    // Fallback: Neon peut refuser l'ouverture d'une transaction longue.
    await prisma.expense.deleteMany();
    await prisma.category.deleteMany();
    await prisma.user.deleteMany();
  }

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
