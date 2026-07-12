import "dotenv/config";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL missing");

const prisma = new PrismaClient({ adapter: new PrismaNeon({ connectionString }) });

try {
  const [users, categories, expenses] = await Promise.all([
    prisma.user.count(),
    prisma.category.count(),
    prisma.expense.count(),
  ]);

  console.log(JSON.stringify({ users, categories, expenses }));
} finally {
  await prisma.$disconnect();
}
