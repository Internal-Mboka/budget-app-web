import { neonConfig } from "@neondatabase/serverless";
import { PrismaNeon } from "@prisma/adapter-neon";
import { PrismaClient, Prisma } from "@prisma/client";
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
const PRISMA_CLIENT_VERSION = 15;

/** Models that must exist on the cached client (guards stale webpack/global singletons). */
const REQUIRED_DELEGATES = ["alertSettings", "generatedExport", "invitationToken"] as const;

/** User scalar fields that must exist after invitation migration. */
const REQUIRED_USER_FIELDS = ["accountStatus"] as const;

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

function isEdgeRuntime(): boolean {
  return process.env.NEXT_RUNTIME === "edge";
}

function schemaHasRequiredUserFields(): boolean {
  try {
    const userModel = Prisma.dmmf.datamodel.models.find((model) => model.name === "User");

    if (!userModel) {
      return false;
    }

    const fieldNames = new Set(userModel.fields.map((field) => field.name));

    return REQUIRED_USER_FIELDS.every((field) => fieldNames.has(field));
  } catch {
    // Edge bundles Prisma without DMMF — skip here; Node validates on first query.
    return true;
  }
}

function clientHasRequiredUserFields(client: unknown): boolean {
  if (!client || typeof client !== "object") {
    return false;
  }

  const runtimeModel = (
    client as {
      _runtimeDataModel?: { models?: { User?: { fields?: Array<{ name: string }> } } };
    }
  )._runtimeDataModel?.models?.User;

  if (runtimeModel?.fields) {
    const fieldNames = new Set(runtimeModel.fields.map((field) => field.name));

    return REQUIRED_USER_FIELDS.every((field) => fieldNames.has(field));
  }

  return schemaHasRequiredUserFields();
}

function clientIsCompatible(client: unknown): boolean {
  return clientHasRequiredDelegates(client) && clientHasRequiredUserFields(client);
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
  if (isEdgeRuntime()) {
    throw new Error("Prisma Client is not available in Edge Runtime.");
  }

  const cached = globalForPrisma.prisma;
  const versionMatches = globalForPrisma.prismaClientVersion === PRISMA_CLIENT_VERSION;

  if (cached && versionMatches && clientIsCompatible(cached)) {
    return cached;
  }

  if (cached) {
    void cached.$disconnect().catch(() => {});
    globalForPrisma.prisma = undefined;
    globalForPrisma.prismaClientVersion = undefined;
  }

  if (!schemaHasRequiredUserFields()) {
    throw new Error(
      "Client Prisma obsolète — exécutez `npx prisma generate` puis redémarrez le serveur de dev."
    );
  }

  const client = createPrismaClient();
  globalForPrisma.prisma = client;
  globalForPrisma.prismaClientVersion = PRISMA_CLIENT_VERSION;
  return client;
}

/** Proxy so HMR never keeps a stale delegate (e.g. generatedExport) on a cached import. */
export const prisma: ReturnType<typeof createPrismaClient> = new Proxy(
  {} as ReturnType<typeof createPrismaClient>,
  {
    get(_target, prop) {
      const client = resolvePrismaClient();
      const value = client[prop as keyof typeof client];

      if (typeof value === "function") {
        return value.bind(client);
      }

      return value;
    },
  }
);

if (process.env.NODE_ENV !== "production" && !isEdgeRuntime()) {
  globalForPrisma.prisma = resolvePrismaClient();
}
