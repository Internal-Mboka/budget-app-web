import { Prisma } from "@prisma/client";
import Image from "next/image";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { canEditByRole, clearSessionUser, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const transactionSchema = z.object({
  title: z.string().trim().min(2, "Le libelle est requis"),
  amount: z.coerce.number().positive("Le montant doit etre superieur a 0"),
  category: z.string().trim().max(80).optional(),
  spentAt: z.coerce.date().optional(),
});

const historyTypeSchema = z.enum(["ALL", "ENTREE", "SORTIE"]);

type BudgetHealth = {
  level: "VERT" | "ORANGE" | "ROUGE";
  badgeClass: string;
  progressClass: string;
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

function getBudgetHealth(spendRatePercent: number): BudgetHealth {
  if (spendRatePercent < 70) {
    return {
      level: "VERT",
      badgeClass: "border-emerald-200 bg-emerald-50 text-emerald-700",
      progressClass: "bg-emerald-500",
      message: "Budget sain",
    };
  }

  if (spendRatePercent <= 90) {
    return {
      level: "ORANGE",
      badgeClass: "border-amber-200 bg-amber-50 text-amber-700",
      progressClass: "bg-amber-500",
      message: "Attention budget",
    };
  }

  return {
    level: "ROUGE",
    badgeClass: "border-rose-200 bg-rose-50 text-rose-700",
    progressClass: "bg-rose-500",
    message: "Alerte budget",
  };
}

async function addIncome(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const parsed = transactionSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
    spentAt: formData.get("spentAt") || undefined,
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-income");
  }

  const { title, amount, category, spentAt } = parsed.data;

  await prisma.expense.create({
    data: {
      userId: user.id,
      title,
      amount: new Prisma.Decimal(amount),
      type: "ENTREE",
      category,
      spentAt,
    },
  });

  revalidatePath("/dashboard");
}

async function addExpense(formData: FormData) {
  "use server";

  const user = await requireCurrentUser();

  if (!canEditByRole(user.role)) {
    redirect("/dashboard?error=forbidden");
  }

  const parsed = transactionSchema.safeParse({
    title: formData.get("title"),
    amount: formData.get("amount"),
    category: formData.get("category") || undefined,
    spentAt: formData.get("spentAt") || undefined,
  });

  if (!parsed.success) {
    redirect("/dashboard?error=invalid-expense");
  }

  const { title, amount, category, spentAt } = parsed.data;

  await prisma.expense.create({
    data: {
      userId: user.id,
      title,
      amount: new Prisma.Decimal(amount),
      type: "SORTIE",
      category,
      spentAt,
    },
  });

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
  }>;
}) {
  const user = await requireCurrentUser();
  const canEdit = canEditByRole(user.role);
  const { start, end } = getMonthRange();
  const filters = await searchParams;

  const fromDate = parseDateInput(filters.from);
  const toDate = parseDateInput(filters.to);
  const categoryFilter = filters.category?.trim() ?? "";
  const queryFilter = filters.q?.trim() ?? "";

  const parsedType = historyTypeSchema.safeParse(filters.type ?? "ALL");
  const typeFilter = parsedType.success ? parsedType.data : "ALL";

  const historyWhere: Prisma.ExpenseWhereInput = {
    user: {
      is: {
        id: user.id,
      },
    },
  };

  if (fromDate || toDate) {
    historyWhere.spentAt = {};

    if (fromDate) {
      historyWhere.spentAt.gte = fromDate;
    }

    if (toDate) {
      const toDateEnd = new Date(toDate);
      toDateEnd.setHours(23, 59, 59, 999);
      historyWhere.spentAt.lte = toDateEnd;
    }
  }

  if (categoryFilter.length > 0) {
    historyWhere.category = categoryFilter;
  }

  if (typeFilter !== "ALL") {
    historyWhere.type = typeFilter;
  }

  if (queryFilter.length > 0) {
    historyWhere.title = {
      contains: queryFilter,
      mode: "insensitive",
    };
  }

  const [monthlyIncomeAgg, monthlyExpenseAgg, totalIncomeAgg, totalExpenseAgg, historyEntries, categories] = await Promise.all([
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
    prisma.expense.findMany({
      where: historyWhere,
      orderBy: [{ spentAt: "desc" }, { createdAt: "desc" }],
      take: 50,
      select: {
        id: true,
        title: true,
        type: true,
        category: true,
        amount: true,
        spentAt: true,
      },
    }),
    prisma.expense.findMany({
      where: {
        user: {
          is: {
            id: user.id,
          },
        },
        category: {
          not: null,
        },
      },
      distinct: ["category"],
      select: {
        category: true,
      },
      orderBy: {
        category: "asc",
      },
      take: 100,
    }),
  ]);

  const monthlyIncome = decimalToNumber(monthlyIncomeAgg._sum.amount);
  const monthlyExpense = decimalToNumber(monthlyExpenseAgg._sum.amount);

  const totalIncome = decimalToNumber(totalIncomeAgg._sum.amount);
  const totalExpense = decimalToNumber(totalExpenseAgg._sum.amount);

  const currentBalance = totalIncome - totalExpense;
  const monthlyNet = monthlyIncome - monthlyExpense;
  const spendRatePercent = monthlyIncome > 0 ? (monthlyExpense / monthlyIncome) * 100 : monthlyExpense > 0 ? 100 : 0;
  const boundedRate = Math.min(100, Math.max(0, spendRatePercent));
  const budgetHealth = getBudgetHealth(boundedRate);
  const categoryOptions = categories
    .map((item) => item.category)
    .filter((value): value is string => typeof value === "string" && value.length > 0);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#eff8ff_0%,#f8fbff_48%,#ffffff_100%)] px-4 py-6 text-[#10579F] sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="rounded-4xl border border-sky-100 bg-white/90 px-4 py-4 shadow-[0_20px_60px_rgba(16,87,159,0.08)] backdrop-blur sm:px-5">
          <nav className="flex items-start justify-between gap-4">
            <button
              type="button"
              aria-label="Ouvrir le menu"
              className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50/70"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
                <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
                <span className="block h-0.5 w-5 rounded-full bg-[#10579F]" />
              </span>
            </button>

            <div className="flex min-w-0 max-w-44 flex-col items-center gap-2 rounded-2xl bg-[#10579F] px-3 py-2 text-white sm:max-w-52 sm:px-4">
              <Image
                src="/photos/mboka.png"
                alt="Logo Mboka"
                width={120}
                height={56}
                className="h-auto w-20 object-contain sm:w-24"
                priority
              />
              <p className="w-full truncate text-center text-xs font-medium leading-tight text-sky-100 sm:text-sm">
                {user.name}
              </p>
            </div>
          </nav>
        </header>

        <main className="flex flex-col gap-8">
          <section className="grid gap-5 rounded-4xl border border-sky-100 bg-white/85 p-5 shadow-[0_20px_60px_rgba(16,87,159,0.08)] sm:p-6">
            <div className="rounded-4xl bg-[#10579F] px-6 py-10 text-white shadow-[0_18px_40px_rgba(16,87,159,0.22)]">
              <p className="text-xs font-medium uppercase tracking-[0.32em] text-sky-100/90">
                Solde actuel
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
                {formatMoney(currentBalance)}
              </h1>
              <div className="mt-6 grid gap-1 rounded-2xl border border-white/20 bg-white/10 p-3 text-xs sm:text-sm">
                <p className="font-medium text-sky-50">Formule: Solde = Encaisse cumulee - Depenses cumulees</p>
                <p className="text-sky-100">Encaisse cumulee: {formatMoney(totalIncome)}</p>
                <p className="text-sky-100">Depenses cumulees: {formatMoney(totalExpense)}</p>
                <p className="font-semibold text-white">Net du mois: {formatMoney(monthlyNet)}</p>
              </div>
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
              <div className="mt-3 h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2.5 rounded-full transition-all ${budgetHealth.progressClass}`}
                  style={{ width: `${boundedRate}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-600">Depenses sur revenus du mois: {boundedRate.toFixed(1)}%</p>
            </div>

            {canEdit ? (
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
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-[#10579F] px-4 py-2.5 text-sm font-semibold text-white"
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
                    <button
                      type="submit"
                      className="w-full rounded-2xl bg-[#10579F] px-4 py-2.5 text-sm font-semibold text-white"
                    >
                      Enregistrer depense
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="rounded-4xl border border-sky-200 bg-sky-50/70 px-4 py-3 text-sm text-[#10579F]">
                Compte en lecture seule: seul un PDG ou un Comptable peut ajouter, modifier ou supprimer des chiffres.
              </div>
            )}
          </section>

          <section className="grid gap-5 rounded-4xl border border-sky-100 bg-white/85 p-5 shadow-[0_20px_60px_rgba(16,87,159,0.08)] sm:p-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex min-h-36 flex-col justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-8">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">
                  Ce mois
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10579F]">
                  Total encaisse
                </h2>
                <p className="mt-4 text-3xl font-semibold text-[#10579F]">{formatMoney(monthlyIncome)}</p>
              </div>

              <div className="flex min-h-36 flex-col justify-center rounded-4xl border border-sky-100 bg-sky-50/80 px-6 py-8">
                <p className="text-xs font-medium uppercase tracking-[0.28em] text-sky-500">
                  Ce mois
                </p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-[#10579F]">
                  Total depenses
                </h2>
                <p className="mt-4 text-3xl font-semibold text-[#10579F]">{formatMoney(monthlyExpense)}</p>
              </div>
            </div>

            <div className="min-h-56 rounded-4xl border border-dashed border-slate-300 bg-slate-200/70 p-4">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-semibold text-slate-700">Historique (tri: plus recent au plus ancien)</p>
                <form action={logout}>
                  <button type="submit" className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700">
                    Deconnexion
                  </button>
                </form>
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
                {historyEntries.length === 0 ? (
                  <p className="text-sm text-slate-500">Aucune ecriture pour le moment.</p>
                ) : (
                  historyEntries.map((entry) => {
                    const isIncome = entry.type === "ENTREE";

                    return (
                      <div
                        key={entry.id}
                        className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-300 bg-white/90 px-3 py-2"
                      >
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-sm font-medium text-slate-800">{entry.title}</p>
                          <p className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat("fr-CD", { dateStyle: "medium" }).format(entry.spentAt)}
                          </p>
                          {entry.category ? <p className="text-[11px] text-slate-500">Categorie: {entry.category}</p> : null}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-semibold ${isIncome ? "text-emerald-700" : "text-rose-700"}`}>
                            {isIncome ? "+" : "-"}
                            {formatMoney(decimalToNumber(entry.amount))}
                          </span>
                          {canEdit ? (
                            <form action={removeEntry}>
                              <input type="hidden" name="entryId" value={entry.id} />
                              <button
                                type="submit"
                                className="rounded-xl border border-slate-300 bg-white px-2.5 py-1 text-xs text-slate-700"
                              >
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