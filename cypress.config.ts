import { config as loadEnv } from "dotenv";
import { defineConfig } from "cypress";

loadEnv();

export default defineConfig({
  e2e: {
    baseUrl: "http://localhost:3000",
    supportFile: "cypress/support/e2e.ts",
    specPattern: "cypress/e2e/**/*.cy.{js,jsx,ts,tsx}",
    env: {
      DT_EMAIL: process.env.SEED_DT_EMAIL,
      DT_PASSWORD: process.env.SEED_DT_PASSWORD,
      PDG_EMAIL: process.env.SEED_PDG_EMAIL,
      PDG_PASSWORD: process.env.SEED_PDG_PASSWORD ?? process.env.SEED_DT_PASSWORD,
    },
    setupNodeEvents(on, config) {
      on("task", {
        async setFiscalPeriodStatus(status: "OPEN" | "CLOSING" | "CLOSED") {
          const { prisma } = await import("./lib/prisma");
          const period = await prisma.fiscalPeriod.findFirst({
            orderBy: { startDate: "desc" },
            select: { id: true },
          });

          if (!period) {
            throw new Error("Aucun trimestre comptable en base pour le test.");
          }

          await prisma.fiscalPeriod.update({
            where: { id: period.id },
            data: { status },
          });
          await prisma.$disconnect();
          return null;
        },
        async resetFiscalPeriodOpen() {
          const { prisma } = await import("./lib/prisma");
          const { computeFiscalPeriodEndDate, normalizeFiscalPeriodEndDate } = await import(
            "./lib/fiscal-period/dates"
          );

          const periods = await prisma.fiscalPeriod.findMany({
            select: { id: true, startDate: true },
          });

          for (const period of periods) {
            const endDate = normalizeFiscalPeriodEndDate(computeFiscalPeriodEndDate(period.startDate));

            await prisma.fiscalPeriod.update({
              where: { id: period.id },
              data: {
                status: "OPEN",
                endDate,
                validatedByAccountantId: null,
                validatedByPdgId: null,
              },
            });
          }

          await prisma.$disconnect();
          return null;
        },
        async setFiscalPeriodAccountantVisa() {
          const { prisma } = await import("./lib/prisma");

          const period = await prisma.fiscalPeriod.findFirst({
            where: { status: "CLOSING" },
            orderBy: { startDate: "desc" },
            select: { id: true, label: true },
          });

          if (!period) {
            throw new Error("Aucun trimestre CLOSING en base pour le test.");
          }

          const actor = await prisma.user.findFirst({
            where: { isActive: true },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });

          if (!actor) {
            throw new Error("Aucun utilisateur actif pour simuler le visa comptable.");
          }

          await prisma.fiscalPeriod.update({
            where: { id: period.id },
            data: { validatedByAccountantId: actor.id },
          });
          await prisma.$disconnect();
          return period.label;
        },
        async expireOpenFiscalPeriod() {
          const { prisma } = await import("./lib/prisma");
          const { subDays, endOfDay } = await import("date-fns");
          const yesterday = endOfDay(subDays(new Date(), 1));

          const period = await prisma.fiscalPeriod.findFirst({
            where: { status: "OPEN" },
            orderBy: { startDate: "desc" },
            select: { id: true },
          });

          if (!period) {
            throw new Error("Aucun trimestre OPEN en base pour le test.");
          }

          await prisma.fiscalPeriod.update({
            where: { id: period.id },
            data: { endDate: yesterday },
          });
          await prisma.$disconnect();
          return null;
        },
        async syncExpiredFiscalPeriods() {
          const { syncExpiredFiscalPeriodsToClosing } = await import(
            "./lib/fiscal-period/sync-expired-periods"
          );
          const { resolveFiscalPeriodSystemActorUserId } = await import(
            "./lib/fiscal-period/sync-expired-periods"
          );
          const actorUserId = await resolveFiscalPeriodSystemActorUserId();

          if (!actorUserId) {
            throw new Error("Aucun utilisateur actif pour synchroniser le trimestre.");
          }

          const result = await syncExpiredFiscalPeriodsToClosing({ actorUserId });
          const { prisma } = await import("./lib/prisma");
          await prisma.$disconnect();
          return result.transitioned.length;
        },
      });

      return config;
    },
  },
});
