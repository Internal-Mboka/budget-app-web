import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const useFetchDriver =
  process.env.NEON_USE_FETCH === "1" || process.env.NODE_ENV !== "production";

if (useFetchDriver) {
  // Plus stable en dev local (Webpack) : évite les ETIMEDOUT WebSocket vers Neon.
  neonConfig.poolQueryViaFetch = true;
} else {
  neonConfig.webSocketConstructor = ws;
}

const fallbackDatabaseUrl = "postgresql://user:pass@localhost:5432/db";
const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

const adapter = new PrismaNeon({ connectionString });

// Bump when adapter setup changes so dev HMR recreates a stale cached client.
const PRISMA_CLIENT_VERSION = 4;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  prismaClientVersion: number | undefined;
};

function createPrismaClient() {
  return new PrismaClient({
    adapter,
    log: ["error"],
  });
}

if (
  process.env.NODE_ENV !== "production" &&
  globalForPrisma.prismaClientVersion !== PRISMA_CLIENT_VERSION
) {
  void globalForPrisma.prisma?.$disconnect().catch(() => {});
  globalForPrisma.prisma = createPrismaClient();
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
