import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient } from "@prisma/client";
import ws from "ws";

const useFetchDriver =
  process.env.NEON_USE_FETCH === "1" || process.env.NODE_ENV !== "production";

if (useFetchDriver) {
  // Plus stable en dev local (Webpack) : évite les ETIMEDOUT WebSocket vers Neon.
  neonConfig.poolQueryViaFetch = true;
  neonConfig.fetchConnectionCache = true;
} else {
  neonConfig.webSocketConstructor = ws;
}

const fallbackDatabaseUrl = "postgresql://user:pass@localhost:5432/db";
const connectionString = process.env.DATABASE_URL ?? fallbackDatabaseUrl;

const adapter = new PrismaNeon({ connectionString });

// Bump when adapter setup changes so dev HMR recreates a stale cached client.
const PRISMA_CLIENT_VERSION = 7;

const RETRYABLE_DB_ERROR_PATTERN =
  /fetch failed|ETIMEDOUT|ECONNRESET|ECONNREFUSED|Connection terminated|NeonDbError|Error connecting to database/i;

function isRetryableDbError(error: unknown): boolean {
  if (!error) {
    return false;
  }

  if (typeof error === "object" && "type" in error && (error as Event).type === "error") {
    return true;
  }

  const message =
    error instanceof Error
      ? error.message
      : typeof error === "object" && error !== null && "message" in error
        ? String((error as { message?: unknown }).message)
        : String(error);

  return RETRYABLE_DB_ERROR_PATTERN.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
  prismaClientVersion: number | undefined;
};

function createPrismaClient() {
  const client = new PrismaClient({
    adapter,
    log: ["error"],
  });

  return client.$extends({
    query: {
      async $allOperations({ args, query }) {
        const maxAttempts = 3;

        for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
          try {
            return await query(args);
          } catch (error) {
            if (!isRetryableDbError(error) || attempt === maxAttempts) {
              throw error;
            }

            await sleep(250 * attempt);
          }
        }

        throw new Error("Prisma query failed after retries.");
      },
    },
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
