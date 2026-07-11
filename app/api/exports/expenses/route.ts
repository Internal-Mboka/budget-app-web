import { Prisma } from "@prisma/client";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { z } from "zod";

import { canAccessHistoryAndExport, requireCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const exportQuerySchema = z.object({
  format: z.enum(["csv", "pdf"]).default("csv"),
  period: z.enum(["current-month", "all"]).default("current-month"),
});

function decimalToNumber(value: Prisma.Decimal | null | undefined): number {
  if (!value) {
    return 0;
  }

  return Number(value);
}

function getCurrentMonthRange() {
  const now = new Date();
  return {
    start: new Date(now.getFullYear(), now.getMonth(), 1),
    end: new Date(now.getFullYear(), now.getMonth() + 1, 1),
  };
}

function escapeCsv(value: string): string {
  const escaped = value.replaceAll('"', '""');
  return `"${escaped}"`;
}

export async function GET(request: Request) {
  const user = await requireCurrentUser();

  if (!canAccessHistoryAndExport(user.role)) {
    return Response.json(
      {
        ok: false,
        message: "Acces refuse a l'export historique",
      },
      { status: 403 }
    );
  }

  const { searchParams } = new URL(request.url);
  const parsed = exportQuerySchema.safeParse({
    format: searchParams.get("format") ?? "csv",
    period: searchParams.get("period") ?? "current-month",
  });

  if (!parsed.success) {
    return Response.json(
      {
        ok: false,
        message: "Parametres export invalides",
        errors: parsed.error.flatten(),
      },
      { status: 400 }
    );
  }

  const { format, period } = parsed.data;
  const monthRange = getCurrentMonthRange();

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

  const hasRecurringColumnResult = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Expense'
        AND column_name = 'isRecurring'
    ) AS "exists";
  `;
  const hasRecurringColumn = Boolean(hasRecurringColumnResult[0]?.exists);

  const hasExpectedDateColumnResult = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public'
        AND table_name = 'Expense'
        AND column_name = 'expectedDate'
    ) AS "exists";
  `;
  const hasExpectedDateColumn = Boolean(hasExpectedDateColumnResult[0]?.exists);

  const periodConditions: Prisma.Sql[] = [Prisma.sql`e."userId" IS NOT NULL`];
  if (period === "current-month") {
    periodConditions.push(Prisma.sql`e."spentAt" >= ${monthRange.start}`);
    periodConditions.push(Prisma.sql`e."spentAt" < ${monthRange.end}`);
  }
  const whereSql = Prisma.sql`${Prisma.join(periodConditions, " AND ")}`;

  const categorySql = hasCategoryNameColumn ? Prisma.sql`e."categoryName"` : Prisma.sql`NULL::text`;
  const recurringSql = hasRecurringColumn ? Prisma.sql`e."isRecurring"` : Prisma.sql`FALSE`;
  const expectedDateSql = hasExpectedDateColumn ? Prisma.sql`e."expectedDate"` : Prisma.sql`NULL::timestamp`;

  const entries = await prisma.$queryRaw<
    Array<{
      title: string;
      type: "ENTREE" | "SORTIE";
      categoryName: string | null;
      amount: Prisma.Decimal;
      spentAt: Date;
      isRecurring: boolean;
      expectedDate: Date | null;
    }>
  >`
    SELECT
      e."title",
      e."type",
      ${categorySql} AS "categoryName",
      e."amount",
      e."spentAt",
      ${recurringSql} AS "isRecurring",
      ${expectedDateSql} AS "expectedDate"
    FROM "Expense" e
    WHERE ${whereSql}
    ORDER BY e."spentAt" DESC, e."createdAt" DESC
    LIMIT 500;
  `;

  if (format === "csv") {
    const header = ["Titre", "Type", "Categorie", "Montant", "Date", "Recurrent", "DatePrevue"];
    const rows = entries.map((entry) => [
      entry.title,
      entry.type,
      entry.categoryName ?? "",
      decimalToNumber(entry.amount).toFixed(2),
      new Intl.DateTimeFormat("fr-CA").format(entry.spentAt),
      entry.isRecurring ? "oui" : "non",
      entry.expectedDate ? new Intl.DateTimeFormat("fr-CA").format(entry.expectedDate) : "",
    ]);

    const csv = [header, ...rows].map((line) => line.map((value) => escapeCsv(String(value))).join(",")).join("\n");

    return new Response(csv, {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="depenses-${period}.csv"`,
      },
    });
  }

  const totalIncome = entries.filter((item) => item.type === "ENTREE").reduce((acc, item) => acc + decimalToNumber(item.amount), 0);
  const totalExpense = entries.filter((item) => item.type === "SORTIE").reduce((acc, item) => acc + decimalToNumber(item.amount), 0);
  const balance = totalIncome - totalExpense;

  const lines = [
    "Rapport depenses/revenus",
    `Periode: ${period}`,
    `Total revenus: ${totalIncome.toFixed(2)} USD`,
    `Total depenses: ${totalExpense.toFixed(2)} USD`,
    `Solde: ${balance.toFixed(2)} USD`,
    "",
    "Details:",
    ...entries.map((entry) => {
      const sign = entry.type === "ENTREE" ? "+" : "-";
      const date = new Intl.DateTimeFormat("fr-CD", { dateStyle: "medium" }).format(entry.spentAt);
      return `${date} | ${entry.title} | ${entry.categoryName ?? "Sans categorie"} | ${sign}${decimalToNumber(entry.amount).toFixed(2)} USD`;
    }),
  ];

  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdf.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595;
  const pageHeight = 842;
  const marginX = 40;
  const marginTop = 48;
  const lineHeight = 14;

  let page = pdf.addPage([pageWidth, pageHeight]);
  let y = pageHeight - marginTop;

  for (let index = 0; index < lines.length; index += 1) {
    if (y < 50) {
      page = pdf.addPage([pageWidth, pageHeight]);
      y = pageHeight - marginTop;
    }

    const line = lines[index] ?? "";
    const isTitleLine = index <= 4 || line === "Details:";

    page.drawText(line, {
      x: marginX,
      y,
      size: isTitleLine ? 11 : 10,
      font: isTitleLine ? fontBold : font,
      color: rgb(0.06, 0.34, 0.62),
      maxWidth: pageWidth - marginX * 2,
    });

    y -= lineHeight;
  }

  const pdfBytes = await pdf.save();
  const pdfArrayBuffer = pdfBytes.buffer.slice(pdfBytes.byteOffset, pdfBytes.byteOffset + pdfBytes.byteLength);

  return new Response(pdfArrayBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="depenses-${period}.pdf"`,
    },
  });
}
