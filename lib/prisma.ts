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

// Bump when schema/adapter changes so dev HMR recreates a stale cached client.
const PRISMA_CLIENT_VERSION = 10;

/** Models that must exist on the cached client (guards stale webpack/global singletons). */
const REQUIRED_DELEGATES = ["alertSettings", "generatedExport"] as const;

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

function clientHasRequiredDelegates(client: unknown): boolean {
  if (!client || typeof client !== "object") {
    return false;
  }

  return REQUIRED_DELEGATES.every((delegate) => delegate in client);
}

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

function resolvePrismaClient() {
  const cached = globalForPrisma.prisma;
  const versionMatches = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionMatches && clientHasRequiredDelegates(cached)) {
    return cached;
  }

  void cached?.$disconnect().catch(() => {});

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  return client;
}

export const prisma = resolvePrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
