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
          await prisma.fiscalPeriod.updateMany({ data: { status: "OPEN" } });
          await prisma.$disconnect();
          return null;
        },
      });

      return config;
    },
  },
});
