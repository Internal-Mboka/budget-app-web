import { Prisma } from "@prisma/client";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { DashboardPopups } from "./popups";

import { canAccessHistoryAndExport, canEditByRole, clearSessionUser, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
const MAX_TRANSACTIONS = 10;
const SAFETY_THRESHOLD = 50;
const HIGH_INCOME_ALERT_THRESHOLD = 10000;
const HIGH_EXPENSE_ALERT_THRESHOLD = 8000;

const transactionSchema = z.object({
  title: z.string().trim().min(2, "Le libelle est requis"),
  amount: z.coerce.number().positive("Le montant doit etre superieur a 0"),
  category: z.string().trim().max(80).optional(),
  isRecurring: z.coerce.boolean().default(false),
  expectedDate: z.coerce.date().optional(),
  spentAt: z.coerce.date().optional(),
});

const categoryBudgetSchema = z.object({
  categoryName: z.string().trim().min(2, "La categorie est requise").max(80),
  monthlyBudget: z.coerce.number().min(0, "Le budget doit etre superieur ou egal a 0"),
});

const historyTypeSchema = z.enum(["ALL", "ENTREE", "SORTIE"]);

type BudgetHealth = {
  level: "VERT" | "ORANGE" | "ROUGE";
  badgeClass: string;
  ringClass: string;
  valueClass: string;
  message: string;
};

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

function getMonthRange(now = new Date()) {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
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

function getBudgetHealth(spendRatePercent: number, isOverrun: boolean): BudgetHealth {
  if (isOverrun) {
    return {
      level: "ROUGE",
      badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
      ringClass: "stroke-rose-500",
      valueClass: "text-rose-700",
      message: "Depassement du solde",
    };
  }

  if (spendRatePercent < 70) {
    return {
      level: "VERT",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      ringClass: "stroke-emerald-500",
      valueClass: "text-emerald-700",
      message: "Budget sain",
    };
  }

  if (spendRatePercent <= 90) {
    return {
      level: "ORANGE",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      ringClass: "stroke-amber-500",
      valueClass: "text-amber-700",
      message: "Attention budget",
    };
  }

  return {
    level: "ROUGE",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    ringClass: "stroke-rose-500",
    valueClass: "text-rose-700",
    message: "Alerte budget",
  };
}

async function addIncome(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const currentCount = await prisma.expense.count({
    where: {
      user: {
        is: {
          id: user.id,
        },
      },
    },
  });

  if (currentCount >= MAX_TRANSACTIONS) {
    redirect("/dashboard?error=limit-reached");
  }

  const parsed = transactionSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
    isRecurring: formData.get("isRecurring") ?? false,
    expectedDate: formData.get("expectedDate") || undefined,
    spentAt: formData.get("spentAt") || undefined,
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-income");
  }

  const { title, amount, category, isRecurring, expectedDate, spentAt } = parsed.data;

  let categoryId: string | undefined;

  if (category && category.length > 0) {
    try {
      const categoryRecord = await prisma.$queryRaw<Array<{ id: string }>>`
        INSERT INTO "Category" ("userId", "name", "monthlyBudget", "createdAt", "updatedAt")
        VALUES (${user.id}, ${category}, 0, NOW(), NOW())
        ON CONFLICT ("userId", "name")
        DO UPDATE SET "updatedAt" = NOW()
        RETURNING "id";
      `;

      categoryId = categoryRecord[0]?.id;
    } catch (categoryError) {
      console.error("Category upsert unavailable for income", categoryError);
    }
  }

  try {
    await prisma.expense.create({
      data: {
        userId: user.id,
        categoryId,
        title,
        amount: new Prisma.Decimal(amount),
        type: "ENTREE",
        categoryName: category,
        isRecurring,
        expectedDate,
        spentAt,
      },
    });
  } catch (createError) {
    console.error("Income create fallback", createError);
    await prisma.$executeRaw`
      INSERT INTO "Expense" ("userId", "title", "amount", "type", "spentAt", "createdAt", "updatedAt")
      VALUES (${user.id}, ${title}, ${new Prisma.Decimal(amount)}, 'ENTREE', ${spentAt ?? new Date()}, NOW(), NOW());
    `;
  }

  revalidatePath("/dashboard");
}

async function addExpense(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const currentCount = await prisma.expense.count({
    where: {
      user: {
        is: {
          id: user.id,
        },
      },
    },
  });

  if (currentCount >= MAX_TRANSACTIONS) {
    redirect("/dashboard?error=limit-reached");
  }

  const parsed = transactionSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
    isRecurring: formData.get("isRecurring") ?? false,
    expectedDate: formData.get("expectedDate") || undefined,
    spentAt: formData.get("spentAt") || undefined,
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-expense");
  }

  const { title, amount, category, isRecurring, expectedDate, spentAt } = parsed.data;

  let categoryId: string | undefined;
  let categoryBudget = 0;

  if (category && category.length > 0) {
    try {
      const categoryRecord = await prisma.$queryRaw<Array<{ id: string; monthlyBudget: Prisma.Decimal }>>`
        INSERT INTO "Category" ("userId", "name", "monthlyBudget", "createdAt", "updatedAt")
        VALUES (${user.id}, ${category}, 0, NOW(), NOW())
        ON CONFLICT ("userId", "name")
        DO UPDATE SET "updatedAt" = NOW()
        RETURNING "id", "monthlyBudget";
      `;

      categoryId = categoryRecord[0]?.id;
      categoryBudget = decimalToNumber(categoryRecord[0]?.monthlyBudget);
    } catch (categoryError) {
      console.error("Category upsert unavailable for expense", categoryError);
    }
  }

  try {
    await prisma.expense.create({
      data: {
        userId: user.id,
        categoryId,
        title,
        amount: new Prisma.Decimal(amount),
        type: "SORTIE",
        categoryName: category,
        isRecurring,
        expectedDate,
        spentAt,
      },
    });
  } catch (createError) {
    console.error("Expense create fallback", createError);
    await prisma.$executeRaw`
      INSERT INTO "Expense" ("userId", "title", "amount", "type", "spentAt", "createdAt", "updatedAt")
      VALUES (${user.id}, ${title}, ${new Prisma.Decimal(amount)}, 'SORTIE', ${spentAt ?? new Date()}, NOW(), NOW());
    `;
  }

  const currentMonth = new Date();
  const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
  const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);

  const [incomeAgg, expenseAgg, monthlyCategoryExpenseAgg] = await Promise.all([
    prisma.expense.aggregate({
      where: {
        user: {
          is: {
            id: user.id,
          },
        },
        type: "ENTREE",
      },
      _sum: {
        amount: true,
      },
    }),
    prisma.expense.aggregate({
      where: {
        user: {
          is: {
            id: user.id,
          },
        },
        type: "SORTIE",
      },
      _sum: {
        amount: true,
      },
    }),
    category && category.length > 0
      ? prisma.expense.aggregate({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
            type: "SORTIE",
            categoryName: category,
            spentAt: {
              gte: monthStart,
              lt: monthEnd,
            },
          },
          _sum: {
            amount: true,
          },
        })
      : Promise.resolve({ _sum: { amount: null } }),
  ]);

  const availableBalance = decimalToNumber(incomeAgg._sum.amount) - decimalToNumber(expenseAgg._sum.amount);
  const categorySpent = decimalToNumber(monthlyCategoryExpenseAgg._sum.amount);
  const categoryOverrun = categoryBudget > 0 && categorySpent > categoryBudget;

  revalidatePath("/dashboard");

  if (categoryOverrun) {
    redirect(`/dashboard?error=category-limit&category=${encodeURIComponent(category ?? "")}`);
  }

  if (availableBalance <= SAFETY_THRESHOLD) {
    redirect(`/dashboard?warning=low-balance&threshold=${SAFETY_THRESHOLD}`);
  }
}

async function upsertCategoryBudget(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const parsed = categoryBudgetSchema.safeParse({
    categoryName: formData.get("categoryName"),
    monthlyBudget: formData.get("monthlyBudget"),
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-category-budget");
  }

  const { categoryName, monthlyBudget } = parsed.data;

  try {
    await prisma.$executeRaw`
      INSERT INTO "Category" ("userId", "name", "monthlyBudget", "createdAt", "updatedAt")
      VALUES (${user.id}, ${categoryName}, ${new Prisma.Decimal(monthlyBudget)}, NOW(), NOW())
      ON CONFLICT ("userId", "name")
      DO UPDATE SET "monthlyBudget" = EXCLUDED."monthlyBudget", "updatedAt" = NOW();
    `;
  } catch (categoryError) {
    console.error("Category budget unavailable", categoryError);
  }

  revalidatePath("/dashboard");
}

async function removeEntry(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const id = z.string().trim().min(1).parse(formData.get("entryId"));

  await prisma.expense.deleteMany({
    where: {
      id,
      user: {
        is: {
          id: user.id,
        },
      },
    },
  });

  revalidatePath("/dashboard");
}

async function logout() {
  "use server";

  await clearSessionUser();
  redirect("/");
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{
    from?: string;
    to?: string;
    category?: string;
    type?: string;
    q?: string;
    error?: string;
    warning?: string;
    threshold?: string;
  }>;
}) {
  const user = await requireCurrentUser();
  const canEdit = canEditByRole(user.role);
  const canViewAllHistory = canAccessHistoryAndExport(user.role);
  const { start, end } = getMonthRange();
  const filters = await searchParams;

  const fromDate = parseDateInput(filters.from);
  const toDate = parseDateInput(filters.to);
  const categoryFilter = filters.category?.trim() ?? "";
  const queryFilter = filters.q?.trim() ?? "";

  const parsedType = historyTypeSchema.safeParse(filters.type ?? "ALL");
  const typeFilter = parsedType.success ? parsedType.data : "ALL";
  const errorCode = filters.error ?? "";
  const warningCode = filters.warning ?? "";

  const toDateEnd = toDate ? new Date(toDate) : null;
  if (toDateEnd) {
    toDateEnd.setHours(23, 59, 59, 999);
  }

  let dbError: string | null = null;
  let monthlyIncome = 0;
  let monthlyExpense = 0;
  let totalIncome = 0;
  let totalExpense = 0;
  let transactionCount = 0;
  let historyEntries: Array<{
    id: string;
    title: string;
    type: "ENTREE" | "SORTIE";
    categoryName: string | null;
    amount: Prisma.Decimal;
    spentAt: Date;
  }> = [];
  let categoryOptions: string[] = [];
  let categoryBudgets: Array<{ name: string; monthlyBudget: Prisma.Decimal }> = [];

  try {
    const [monthlyIncomeAgg, monthlyExpenseAgg, totalIncomeAgg, totalExpenseAgg, totalCount] =
      await Promise.all([
        prisma.expense.aggregate({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
            type: "ENTREE",
            spentAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.expense.aggregate({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
            type: "SORTIE",
            spentAt: {
              gte: start,
              lt: end,
            },
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.expense.aggregate({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
            type: "ENTREE",
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.expense.aggregate({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
            type: "SORTIE",
          },
          _sum: {
            amount: true,
          },
        }),
        prisma.expense.count({
          where: {
            user: {
              is: {
                id: user.id,
              },
            },
          },
        }),
      ]);

    let historyRows: Array<{
      id: string;
      title: string;
      type: "ENTREE" | "SORTIE";
      categoryName: string | null;
      amount: Prisma.Decimal;
      spentAt: Date;
    }> = [];

    let categories: Array<{ categoryName: string | null }> = [];

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

    const historyConditions: Prisma.Sql[] = [Prisma.sql`"userId" = ${user.id}`];

    if (fromDate) {
      historyConditions.push(Prisma.sql`"spentAt" >= ${fromDate}`);
    }
    if (toDateEnd) {
      historyConditions.push(Prisma.sql`"spentAt" <= ${toDateEnd}`);
    }
    if (typeFilter !== "ALL") {
      historyConditions.push(Prisma.sql`"type" = ${typeFilter}`);
    }
    if (queryFilter.length > 0) {
      historyConditions.push(Prisma.sql`"title" ILIKE ${`%${queryFilter}%`}`);
    }
    if (categoryFilter.length > 0 && hasCategoryNameColumn) {
      historyConditions.push(Prisma.sql`"categoryName" = ${categoryFilter}`);
    }

    const whereSql = Prisma.sql`${Prisma.join(historyConditions, " AND ")}`;

    if (hasCategoryNameColumn) {
      historyRows = await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          type: "ENTREE" | "SORTIE";
          categoryName: string | null;
          amount: Prisma.Decimal;
          spentAt: Date;
        }>
      >`
        SELECT "id", "title", "type", "categoryName", "amount", "spentAt"
        FROM "Expense"
        WHERE ${whereSql}
        ORDER BY "spentAt" DESC, "createdAt" DESC
        LIMIT 50;
      `;

      categories = await prisma.$queryRaw<Array<{ categoryName: string | null }>>`
        SELECT DISTINCT "categoryName"
        FROM "Expense"
        WHERE "userId" = ${user.id}
          AND "categoryName" IS NOT NULL
        ORDER BY "categoryName" ASC
        LIMIT 100;
      `;
    } else {
      historyRows = await prisma.$queryRaw<
        Array<{
          id: string;
          title: string;
          type: "ENTREE" | "SORTIE";
          categoryName: string | null;
          amount: Prisma.Decimal;
          spentAt: Date;
        }>
      >`
        SELECT "id", "title", "type", NULL::text AS "categoryName", "amount", "spentAt"
        FROM "Expense"
        WHERE ${whereSql}
        ORDER BY "spentAt" DESC, "createdAt" DESC
        LIMIT 50;
      `;
    }

    let budgets: Array<{ name: string; monthlyBudget: Prisma.Decimal }> = [];

    const hasCategoryTableResult = await prisma.$queryRaw<Array<{ exists: boolean }>>`
      SELECT to_regclass('public."Category"') IS NOT NULL AS "exists";
    `;
    const hasCategoryTable = Boolean(hasCategoryTableResult[0]?.exists);

    if (hasCategoryTable) {
      try {
        budgets = await prisma.$queryRaw<Array<{ name: string; monthlyBudget: Prisma.Decimal }>>`
          SELECT "name", "monthlyBudget"
          FROM "Category"
          WHERE "userId" = ${user.id}
          ORDER BY "name" ASC;
        `;
      } catch (categoryError) {
        console.error("Dashboard category query unavailable", categoryError);
      }
    }

    monthlyIncome = decimalToNumber(monthlyIncomeAgg._sum.amount);
    monthlyExpense = decimalToNumber(monthlyExpenseAgg._sum.amount);
    totalIncome = decimalToNumber(totalIncomeAgg._sum.amount);
    totalExpense = decimalToNumber(totalExpenseAgg._sum.amount);
    transactionCount = totalCount;
    historyEntries = historyRows;
    categoryOptions = categories
      .map((item: { categoryName: string | null }) => item.categoryName)
      .filter((value: string | null): value is string => typeof value === "string" && value.length > 0);
    categoryBudgets = budgets;
  } catch (error) {
    dbError = "Connexion a la base indisponible. Reessaie dans quelques secondes.";
    console.error("Dashboard database error", error);
  }

  const currentBalance = totalIncome - totalExpense;
  const monthlyNet = monthlyIncome - monthlyExpense;
  const spendRatePercent = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : monthlyExpense > 0 ? 100 : 0;
  const boundedRate = Math.min(100, Math.max(0, spendRatePercent));
  const isOverrun = currentBalance < 0 || monthlyNet < 0;
  const budgetHealth = getBudgetHealth(boundedRate, isOverrun);
  const limitReached = transactionCount >= MAX_TRANSACTIONS;
  const circleRadius = 44;
  const circleCircumference = 2 * Math.PI * circleRadius;
  const circleOffset = circleCircumference * (1 - boundedRate / 100);
  const previewHistoryEntries = historyEntries.slice(0, 5);
  const showHighIncomePopup = monthlyIncome >= HIGH_INCOME_ALERT_THRESHOLD;
  const showHighExpensePopup = monthlyExpense >= HIGH_EXPENSE_ALERT_THRESHOLD;
  const showBudgetDangerPopup = boundedRate >= 90 || isOverrun;

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-6 text-[#10579F] sm:px-6 lg:px-8">
      <DashboardPopups
        showHighIncome={showHighIncomePopup}
        showHighExpense={showHighExpensePopup}
        showBudgetDanger={showBudgetDangerPopup}
        monthlyIncome={monthlyIncome}
        monthlyExpense={monthlyExpense}
      />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="rounded-4xl border border-sky-100 bg-white/90 px-4 py-4 shadow-[0_20px_60px_rgba(16,87,159,0.08)] backdrop-blur sm:px-5">
          <nav className="flex items-center justify-between gap-4">
            <details className="relative">
              <summary
                aria-label="Ouvrir le menu"
                className="flex h-12 w-12 shrink-0 cursor-pointer list-none items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/70 [&::-webkit-details-marker]:hidden"
              >
                <span className="flex flex-col gap-1.5">
                  <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
                  <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
                  <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
                </span>
              </summary>
              <div className="absolute left-1/2 top-full z-20 mt-3 w-56 -translate-x-1/2 rounded-2xl border border-sky-100 bg-white p-2 shadow-[0_12px_28px_rgba(16,87,159,0.16)]">
                <a href="/historique" className="block rounded-xl px-3 py-2 text-sm font-medium text-[#10579F] hover:bg-sky-50">
                  Historique
                </a>
                <button
                  type="button"
                  disabled
                  className="mt-1 block w-full cursor-not-allowed rounded-xl px-3 py-2 text-left text-sm font-medium text-slate-400"
                >
                  Projet avenir
                </button>
              </div>
            </details>

            <div className="flex min-w-0 max-w-44 flex-col items-center gap-2 rounded-2xl bg-[#10579F] px-3 py-2 text-white sm:max-w-52 sm:px-4">
              <Image
                src="/photos/mboka.png"
                alt="Logo Mboka"
                width={120}
                height={56}
                className="h-auto w-20 object-contain sm:w-24"
                priority
              />
              <p className="w-full truncate text-center text-xs font-medium leading-tight text-sky-100 sm:text-sm">{user.name}</p>
            </div>
          </nav>
        </header>

        <main className="flex flex-col gap-8">
          {dbError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{dbError}</div>
          ) : null}

          {errorCode === "limit-reached" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Limite atteinte: maximum {MAX_TRANSACTIONS} ecritures. Supprime une operation pour continuer.
            </div>
          ) : null}

          {errorCode === "forbidden-history" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Acces refuse a la page historique globale.</div>
          ) : null}

          {errorCode === "category-limit" ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">Alerte depassement categorie: budget categorie depasse.</div>
          ) : null}

          {warningCode === "low-balance" ? (
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700">
              Attention, solde disponible critique: il reste moins de {formatMoney(SAFETY_THRESHOLD)}.
            </div>
          ) : null}

          <section className="grid gap-5 rounded-4xl border border-sky-100 bg-white/85 p-5 shadow-[0_20px_60px_rgba(16,87,159,0.08)] sm:p-6">
            <div className="rounded-4xl bg-[#10579F] px-6 py-10 text-white shadow-[0_18px_40px_rgba(16,87,159,0.22)]">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-sky-100/90">Solde actuel</p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">{formatMoney(currentBalance)}</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <a
                href="#form-revenus"
                className="flex min-h-28 items-center justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-6 text-center text-lg font-semibold text-[#10579F] transition hover:bg-sky-100"
              >
                Ajouter revenus
              </a>
              <a
                href="#form-depenses"
                className="flex min-h-28 items-center justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-6 text-center text-lg font-semibold text-[#10579F] transition hover:bg-sky-100"
              >
                Ajouter depenses
              </a>
            </div>

            <div className="rounded-4xl border border-sky-100 bg-white p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm font-semibold text-[#10579F]">Sante budget mensuelle</p>
                <span className={`rounded-full border px-3 py-1 text-xs font-semibold ${budgetHealth.badgeClass}`}>
                  {budgetHealth.level} - {budgetHealth.message}
                </span>
              </div>
              <div className="mt-4 flex items-center gap-4">
                <div className="relative h-28 w-28">
                  <svg className="h-28 w-28 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                    <circle cx="50" cy="50" r={circleRadius} strokeWidth="8" className="fill-none stroke-slate-200" />
                    <circle
                      cx="50"
                      cy="50"
                      r={circleRadius}
                      strokeWidth="8"
                      strokeLinecap="round"
                      className={`fill-none transition-all duration-300 ${budgetHealth.ringClass}`}
                      strokeDasharray={circleCircumference}
                      strokeDashoffset={circleOffset}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-base font-bold ${budgetHealth.valueClass}`}>{boundedRate.toFixed(0)}%</span>
                  </div>
                </div>
                <div className="grid gap-1 text-xs text-slate-600 sm:text-sm">
                  <p className="font-medium text-slate-700">Depenses sur revenus du mois</p>
                  <p>Net du mois: {formatMoney(monthlyNet)}</p>
                  <p>Capacite utilisee: {boundedRate.toFixed(1)}%</p>
                </div>
              </div>
            </div>

            {canEdit ? (
              <>
                <div className="grid gap-4 md:grid-cols-2">
                  <form id="form-revenus" action={addIncome} className="rounded-4xl border border-sky-100 bg-white p-4">
                    <p className="text-sm font-semibold text-[#10579F]">Nouveau revenu</p>
                    <div className="mt-3 grid gap-3">
                      <input
                        name="title"
                        type="text"
                        placeholder="Libelle"
                        required
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Montant"
                        required
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="category"
                        type="text"
                        placeholder="Categorie (optionnel)"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="spentAt"
                        type="date"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="expectedDate"
                        type="date"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input name="isRecurring" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        Revenu recurrent
                      </label>
                      <button
                        type="submit"
                        disabled={limitReached}
                        className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
                          limitReached ? "cursor-not-allowed bg-slate-400" : "bg-[#10579F]"
                        }`}
                      >
                        Enregistrer revenu
                      </button>
                    </div>
                  </form>

                  <form id="form-depenses" action={addExpense} className="rounded-4xl border border-sky-100 bg-white p-4">
                    <p className="text-sm font-semibold text-[#10579F]">Nouvelle depense</p>
                    <div className="mt-3 grid gap-3">
                      <input
                        name="title"
                        type="text"
                        placeholder="Libelle"
                        required
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="amount"
                        type="number"
                        min="0.01"
                        step="0.01"
                        placeholder="Montant"
                        required
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="category"
                        type="text"
                        placeholder="Categorie (optionnel)"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="spentAt"
                        type="date"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <input
                        name="expectedDate"
                        type="date"
                        className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                      />
                      <label className="flex items-center gap-2 text-xs text-slate-600">
                        <input name="isRecurring" type="checkbox" className="h-4 w-4 rounded border-slate-300" />
                        Depense recurrente
                      </label>
                      <button
                        type="submit"
                        disabled={limitReached}
                        className={`w-full rounded-2xl px-4 py-2.5 text-sm font-semibold text-white ${
                          limitReached ? "cursor-not-allowed bg-slate-400" : "bg-[#10579F]"
                        }`}
                      >
                        Enregistrer depense
                      </button>
                    </div>
                  </form>
                </div>

                <form action={upsertCategoryBudget} className="rounded-4xl border border-sky-100 bg-white p-4">
                  <p className="text-sm font-semibold text-[#10579F]">Budget par categorie</p>
                  <div className="mt-3 grid gap-3 md:grid-cols-3">
                    <input
                      name="categoryName"
                      type="text"
                      placeholder="Ex: Nourriture"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                    />
                    <input
                      name="monthlyBudget"
                      type="number"
                      min="0"
                      step="0.01"
                      placeholder="Budget mensuel"
                      required
                      className="w-full rounded-2xl border border-sky-100 bg-sky-50/60 px-4 py-2.5 text-sm text-slate-700 outline-none focus:border-[#10579F]"
                    />
                    <button type="submit" className="w-full rounded-2xl bg-[#10579F] px-4 py-2.5 text-sm font-semibold text-white">
                      Enregistrer budget
                    </button>
                  </div>
                  {categoryBudgets.length > 0 ? (
                    <div className="mt-3 grid gap-1 text-xs text-slate-600">
                      {categoryBudgets.map((item) => (
                        <p key={item.name}>
                          {item.name}: {formatMoney(decimalToNumber(item.monthlyBudget))}
                        </p>
                      ))}
                    </div>
                  ) : null}
                </form>
              </>
            ) : (
              <div className="rounded-4xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-[#10579F]">
                Compte en lecture seule: seul un PDG ou un Comptable peut ajouter, modifier ou supprimer des chiffres.
              </div>
            )}
          </section>

          <section className="grid gap-5 rounded-4xl border border-sky-100 bg-white/85 p-5 shadow-[0_20px_60px_rgba(16,87,159,0.08)] sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex min-h-36 flex-col justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-8">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Total encaisse</p>
                <h2 className="mt-3 text-4xl font-semibold tracking-tight text-[#10579F] sm:text-5xl">{formatMoney(totalIncome)}</h2>
                <p className="mt-3 text-sm text-slate-600">Ce mois: {formatMoney(monthlyIncome)}</p>
                <p className="text-sm text-slate-600">Formule solde: Encaisse - Depenses</p>
              </div>

              <div className="flex min-h-36 flex-col justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-8">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">Total decaisse</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10579F]">Total depenses</h2>
                <p className="mt-4 text-3xl font-semibold text-[#10579F]">{formatMoney(totalExpense)}</p>
                <p className="mt-3 text-sm text-slate-600">Ce mois: {formatMoney(monthlyExpense)}</p>
              </div>
            </div>

            <div className="min-h-56 rounded-4xl border border-dashed border-slate-300 bg-slate-200/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Historique (tri: plus recent au plus ancien)</p>
                <div className="flex items-center gap-2">
                  {canViewAllHistory ? (
                    <a href="/historique" className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                      Voir tout
                    </a>
                  ) : null}
                  <form action={logout}>
                    <button type="submit" className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                      Deconnexion
                    </button>
                  </form>
                </div>
              </div>

              <form method="get" className="mt-3 grid gap-2 rounded-2xl border border-slate-300 bg-white/80 p-3 md:grid-cols-5">
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
                <select name="type" defaultValue={typeFilter} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-700">
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
                  {categoryOptions.map((category) => (
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
                  <a href="/dashboard" className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-medium text-slate-700">
                    Reinitialiser
                  </a>
                </div>
              </form>

              <div className="mt-3 grid gap-2">
                {previewHistoryEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune ecriture pour le moment.</p>
                ) : (
                  previewHistoryEntries.map((entry) => {
                    const isIncome = entry.type === "ENTREE";

                    return (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-300 bg-white/90 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{entry.title}</p>
                          <p className="text-xs text-slate-500">{new Intl.DateTimeFormat("fr-CD", { dateStyle: "medium" }).format(entry.spentAt)}</p>
                          {entry.categoryName ? <p className="text-[11px] text-slate-500">Categorie: {entry.categoryName}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                            {isIncome ? "+" : "-"}
                            {formatMoney(decimalToNumber(entry.amount))}
                          </span>
                          {canEdit ? (
                            <form action={removeEntry}>
                              <input type="hidden" name="entryId" value={entry.id} />
                              <button type="submit" className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700">
                                Supprimer
                              </button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
