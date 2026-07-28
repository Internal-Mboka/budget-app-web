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
            orderBy: { startDate: "asc" },
            select: { id: true, startDate: true },
          });

          if (periods.length === 0) {
            await prisma.$disconnect();
            return null;
          }

          const [keep, ...extras] = periods;

          if (extras.length > 0) {
            await prisma.fiscalPeriod.deleteMany({
              where: { id: { in: extras.map((period) => period.id) } },
            });
            await prisma.financialPeriodClosure.deleteMany({
              where: { fiscalPeriodId: { in: extras.map((period) => period.id) } },
            });
          }

          await prisma.financialPeriodClosure.deleteMany({
            where: { fiscalPeriodId: keep.id },
          });

          const endDate = normalizeFiscalPeriodEndDate(computeFiscalPeriodEndDate(keep.startDate));

          await prisma.fiscalPeriod.update({
            where: { id: keep.id },
            data: {
              status: "OPEN",
              endDate,
              closedAt: null,
              validatedByAccountantId: null,
              validatedByPdgId: null,
            },
          });

          await prisma.$disconnect();
          return null;
        },
        async getFiscalPeriodStatusCounts() {
          const { prisma } = await import("./lib/prisma");

          const [open, closing, closed] = await Promise.all([
            prisma.fiscalPeriod.count({ where: { status: "OPEN" } }),
            prisma.fiscalPeriod.count({ where: { status: "CLOSING" } }),
            prisma.fiscalPeriod.count({ where: { status: "CLOSED" } }),
          ]);

          await prisma.$disconnect();
          return { open, closing, closed };
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
        async getClosedFiscalPeriodId() {
          const { prisma } = await import("./lib/prisma");

          const period = await prisma.fiscalPeriod.findFirst({
            where: { status: "CLOSED" },
            orderBy: { closedAt: "desc" },
            select: { id: true },
          });

          await prisma.$disconnect();

          if (!period) {
            throw new Error("Aucun trimestre CLOSED en base pour le test.");
          }

          return period.id;
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
        async getInvitationTokenForEmail(email: string) {
          const { prisma } = await import("./lib/prisma");
          const { createPasswordResetToken } = await import("./lib/password");
          const { INVITE_TOKEN_TTL_MS } = await import("./lib/invitations/constants");

          const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: "insensitive" } },
            select: { id: true, accountStatus: true },
          });

          if (!user || user.accountStatus !== "PENDING") {
            await prisma.$disconnect();
            throw new Error(`Aucun compte PENDING trouvé pour ${email}.`);
          }

          const dt = await prisma.user.findFirst({
            where: { isActive: true, accountStatus: "ACTIVE" },
            orderBy: { createdAt: "asc" },
            select: { id: true },
          });

          if (!dt) {
            await prisma.$disconnect();
            throw new Error("Aucun administrateur actif pour émettre le token de test.");
          }

          const { token, tokenHash } = createPasswordResetToken();
          const expiresAt = new Date(Date.now() + INVITE_TOKEN_TTL_MS);

          await prisma.invitationToken.deleteMany({ where: { userId: user.id } });
          await prisma.invitationToken.create({
            data: {
              userId: user.id,
              invitedById: dt.id,
              tokenHash,
              expiresAt,
            },
          });

          await prisma.$disconnect();
          return token;
        },
      });

      return config;
    },
  },
});
