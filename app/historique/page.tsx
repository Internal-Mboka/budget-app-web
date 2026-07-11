import { Prisma, UserRole } from "@prisma/client";
import { redirect } from "next/navigation";
import { z } from "zod";

import { canAccessHistoryAndExport, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const historyTypeSchema = z.enum(["ALL", "ENTREE", "SORTIE"]);

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) {
    return 0;
  }

  return Number(value);
}

function formatMoney(value: number): string {
  return new Intl.NumberFormat("fr-CD", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function parseDateInput(value?: string): Date | null {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed;
}

export default async function HistoriquePage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    type?: string;
    q?: string;
  }>;
}) {
  const user = await requireCurrentUser();

  if (!canAccessHistoryAndExport(user.role)) {
    redirect("/dashboard?error=forbidden-history");
  }

  const filters = await searchParams;
  const fromDate = parseDateInput(filters.from);
  const toDate = parseDateInput(filters.to);
  const categoryFilter = filters.category?.trim() ?? "";
  const queryFilter = filters.q?.trim() ?? "";
  const parsedType = historyTypeSchema.safeParse(filters.type ?? "ALL");
  const typeFilter = parsedType.success ? parsedType.data : "ALL";

  const toDateEnd = toDate ? new Date(toDate) : null;
  if (toDateEnd) {
    toDateEnd.setHours(23, 59, 59, 999);
  }

  const hasCategoryNameColumnResult = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Expense'
        AND column_name = 'categoryName'
    ) AS "exists";
  `;
  const hasCategoryNameColumn = Boolean(hasCategoryNameColumnResult[0]?.exists);

  const historyConditions: Prisma.Sql[] = [Prisma.sql`e."userId" IS NOT NULL`];
  if (fromDate) {
    historyConditions.push(Prisma.sql`e."spentAt" >= ${fromDate}`);
  }
  if (toDateEnd) {
    historyConditions.push(Prisma.sql`e."spentAt" <= ${toDateEnd}`);
  }
  if (typeFilter !== "ALL") {
    historyConditions.push(Prisma.sql`e."type" = ${typeFilter}`);
  }
  if (queryFilter.length > 0) {
    historyConditions.push(Prisma.sql`e."title" ILIKE ${`%${queryFilter}%`}`);
  }
  if (categoryFilter.length > 0 && hasCategoryNameColumn) {
    historyConditions.push(Prisma.sql`e."categoryName" = ${categoryFilter}`);
  }

  const whereSql = Prisma.sql`${Prisma.join(historyConditions, " AND ")}`;

  let entries: Array<{
    id: string;
    title: string;
    amount: Prisma.Decimal;
    type: "ENTREE" | "SORTIE";
    categoryName: string | null;
    spentAt: Date;
    user: { name: string | null; role: UserRole | null } | null;
  }> = [];

  try {
    entries = hasCategoryNameColumn
      ? await prisma.$queryRaw<
          Array<{
            id: string;
            title: string;
            amount: Prisma.Decimal;
            type: "ENTREE" | "SORTIE";
            categoryName: string | null;
            spentAt: Date;
            user: { name: string | null; role: UserRole | null } | null;
          }>
        >`
          SELECT
            e."id",
            e."title",
            e."amount",
            e."type",
            e."categoryName",
            e."spentAt",
            row_to_json(u)::jsonb AS "user"
          FROM "Expense" e
          LEFT JOIN (
            SELECT "id", "name", "role"
            FROM "User"
          ) u ON u."id" = e."userId"
          WHERE ${whereSql}
          ORDER BY e."spentAt" DESC, e."createdAt" DESC
          LIMIT 300;
        `
      : await prisma.$queryRaw<
          Array<{
            id: string;
            title: string;
            amount: Prisma.Decimal;
            type: "ENTREE" | "SORTIE";
            categoryName: string | null;
            spentAt: Date;
            user: { name: string | null; role: UserRole | null } | null;
          }>
        >`
          SELECT
            e."id",
            e."title",
            e."amount",
            e."type",
            NULL::text AS "categoryName",
            e."spentAt",
            row_to_json(u)::jsonb AS "user"
          FROM "Expense" e
          LEFT JOIN (
            SELECT "id", "name", "role"
            FROM "User"
          ) u ON u."id" = e."userId"
          WHERE ${whereSql}
          ORDER BY e."spentAt" DESC, e."createdAt" DESC
          LIMIT 300;
        `;
  } catch (entriesJoinError) {
    console.error("Historique entries user join unavailable", entriesJoinError);
    entries = hasCategoryNameColumn
      ? await prisma.$queryRaw<
          Array<{
            id: string;
            title: string;
            amount: Prisma.Decimal;
            type: "ENTREE" | "SORTIE";
            categoryName: string | null;
            spentAt: Date;
            user: { name: string | null; role: UserRole | null } | null;
          }>
        >`
          SELECT
            e."id",
            e."title",
            e."amount",
            e."type",
            e."categoryName",
            e."spentAt",
            NULL::jsonb AS "user"
          FROM "Expense" e
          WHERE ${whereSql}
          ORDER BY e."spentAt" DESC, e."createdAt" DESC
          LIMIT 300;
        `
      : await prisma.$queryRaw<
          Array<{
            id: string;
            title: string;
            amount: Prisma.Decimal;
            type: "ENTREE" | "SORTIE";
            categoryName: string | null;
            spentAt: Date;
            user: { name: string | null; role: UserRole | null } | null;
          }>
        >`
          SELECT
            e."id",
            e."title",
            e."amount",
            e."type",
            NULL::text AS "categoryName",
            e."spentAt",
            NULL::jsonb AS "user"
          FROM "Expense" e
          WHERE ${whereSql}
          ORDER BY e."spentAt" DESC, e."createdAt" DESC
          LIMIT 300;
        `;
  }

  const totals = await prisma.$queryRaw<
    Array<{
      type: "ENTREE" | "SORTIE";
      sumAmount: Prisma.Decimal | null;
      countAll: bigint;
    }>
  >`
    SELECT e."type", SUM(e."amount") AS "sumAmount", COUNT(*)::bigint AS "countAll"
    FROM "Expense" e
    WHERE ${whereSql}
    GROUP BY e."type";
  `;

  const categoryOptions = hasCategoryNameColumn
    ? await prisma.$queryRaw<Array<{ categoryName: string | null }>>`
        SELECT DISTINCT e."categoryName"
        FROM "Expense" e
        WHERE e."categoryName" IS NOT NULL
        ORDER BY e."categoryName" ASC
        LIMIT 150;
      `
    : [];

  const totalIncome = decimalToNumber(totals.find((item) => item.type === "ENTREE")?.sumAmount);
  const totalExpense = decimalToNumber(totals.find((item) => item.type === "SORTIE")?.sumAmount);
  const totalCount = totals.reduce((acc, item) => acc + Number(item.countAll), 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-6 text-[#10579F] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <header className="rounded-4xl border border-sky-100 bg-white/90 px-5 py-4 shadow-[0_20px_60px_rgba(16,87,159,0.08)]">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.3em] text-sky-500">Historique global</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#10579F] sm:text-3xl">
                Entrees et depenses encaissees
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/api/exports/expenses?format=pdf&period=all"
                className="rounded-xl border border-sky-200 bg-sky-50 px-3 py-2 text-xs font-semibold text-[#10579F]"
              >
                Generer PDF
              </a>
              <a href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                Retour dashboard
              </a>
            </div>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-3">
          <div className="rounded-3xl border border-sky-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-500">Total revenus</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-700">{formatMoney(totalIncome)}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-500">Total depenses</p>
            <p className="mt-2 text-2xl font-semibold text-rose-700">{formatMoney(totalExpense)}</p>
          </div>
          <div className="rounded-3xl border border-sky-100 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-sky-500">Nombre ecritures</p>
            <p className="mt-2 text-2xl font-semibold text-[#10579F]">{totalCount}</p>
          </div>
        </section>

        <section className="rounded-4xl border border-slate-300 bg-white/90 p-4 shadow-[0_20px_60px_rgba(16,87,159,0.08)]">
          <form method="get" className="grid gap-2 rounded-2xl border border-slate-300 bg-slate-50/80 p-3 md:grid-cols-5">
            <input
              type="date"
              name="from"
              defaultValue={filters.from ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
            />
            <input
              type="date"
              name="to"
              defaultValue={filters.to ?? ""}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
            />
            <select
              name="type"
              defaultValue={typeFilter}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
            >
              <option value="ALL">Tous types</option>
              <option value="ENTREE">Revenus</option>
              <option value="SORTIE">Depenses</option>
            </select>
            <select
              name="category"
              defaultValue={categoryFilter}
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
            >
              <option value="">Toutes categories</option>
              {categoryOptions
                .map((item) => item.categoryName)
                .filter((value): value is string => typeof value === "string" && value.length > 0)
                .map((category) => (
                  <option key={category} value={category}>
                    {category}
                  </option>
                ))}
            </select>
            <input
              type="text"
              name="q"
              defaultValue={queryFilter}
              placeholder="Recherche libelle"
              className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700"
            />

            <div className="md:col-span-5 flex flex-wrap gap-2">
              <button type="submit" className="rounded-xl bg-[#10579F] px-3 py-2 text-xs font-semibold text-white">
                Filtrer
              </button>
              <a href="/historique" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                Reinitialiser
              </a>
            </div>
          </form>

          <div className="mt-4 grid gap-2">
            {entries.length === 0 ? (
              <p className="text-sm text-slate-500">Aucune ecriture trouvee.</p>
            ) : (
              entries.map((entry) => {
                const isIncome = entry.type === "ENTREE";

                return (
                  <div
                    key={entry.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-300 bg-white px-3 py-2"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-slate-800">{entry.title}</p>
                      <p className="text-xs text-slate-500">
                        {new Intl.DateTimeFormat("fr-CD", { dateStyle: "medium" }).format(entry.spentAt)} - {entry.user?.name ?? "Sans proprietaire"}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Role: {entry.user?.role ?? "INCONNU"}
                        {entry.categoryName ? ` - Categorie: ${entry.categoryName}` : ""}
                      </p>
                    </div>
                    <span className={`text-sm font-semibold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                      {isIncome ? "+" : "-"}
                      {formatMoney(decimalToNumber(entry.amount))}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
