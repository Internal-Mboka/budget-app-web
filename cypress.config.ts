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
      return config;
    },
  },
});
