/// <reference types="cypress" />

Cypress.on("uncaught:exception", (error) => {
  if (error.message.includes("Hydration failed")) {
    return false;
  }

  return undefined;
});

Cypress.Commands.add("dismissPwaPrompt", () => {
  cy.get("body").then(($body) => {
    if ($body.find('[data-testid="pwa-dismiss"]').length > 0) {
      cy.get('[data-testid="pwa-dismiss"]').click({ force: true });
    }
  });
});

Cypress.Commands.add("dismissToasts", () => {
  cy.get("body").then(($body) => {
    const toasts = $body.find("[data-sonner-toast]");

    if (toasts.length === 0) {
      return;
    }

    cy.get("[data-sonner-toast] [data-close-button]").click({ multiple: true, force: true });
  });
});

Cypress.Commands.add("pickMbokaSelect", (fieldId: string, optionLabel: string) => {
  const optionId = `${fieldId}-option-${optionLabel
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}`;

  cy.get(`[data-testid="${fieldId}-trigger"]`).should("be.visible").click();
  cy.get(`[data-testid="${optionId}"]`, { timeout: 10000 })
    .should("be.visible")
    .click({ force: true });
});

Cypress.Commands.add("fillStudioSessionDate", (offsetDays = 30) => {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  const iso = date.toISOString().slice(0, 10);

  cy.get("#metadataSessionDate").should("be.visible").clear().type(iso);
});

Cypress.Commands.add("loginAsDt", () => {
  const email = Cypress.env("DT_EMAIL");
  const password = Cypress.env("DT_PASSWORD");

  if (!email || !password) {
    throw new Error("SEED_DT_EMAIL / SEED_DT_PASSWORD requis pour les tests E2E authentifiés.");
  }

  cy.visit("/login", { retryOnStatusCodeFailure: true, timeout: 30000 });
  cy.dismissPwaPrompt();
  cy.dismissToasts();
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Se connecter").click();
  cy.location("pathname", { timeout: 20000 }).should("eq", "/dashboard");
  cy.dismissToasts();
});

Cypress.Commands.add("loginAsPdg", () => {
  const email = Cypress.env("PDG_EMAIL");
  const password = Cypress.env("PDG_PASSWORD");

  if (!email || !password) {
    throw new Error("SEED_PDG_EMAIL / SEED_PDG_PASSWORD requis pour les tests E2E PDG.");
  }

  cy.visit("/login", { retryOnStatusCodeFailure: true, timeout: 30000 });
  cy.dismissPwaPrompt();
  cy.dismissToasts();
  cy.get("#email").clear().type(email);
  cy.get("#password").clear().type(password);
  cy.contains("button", "Se connecter").click();
  cy.location("pathname", { timeout: 20000 }).should("eq", "/dashboard");
  cy.dismissToasts();
});

declare global {
  namespace Cypress {
    interface Chainable {
      dismissPwaPrompt(): Chainable<void>;
      dismissToasts(): Chainable<void>;
      pickMbokaSelect(fieldId: string, optionLabel: string): Chainable<void>;
      fillStudioSessionDate(offsetDays?: number): Chainable<void>;
      loginAsDt(): Chainable<void>;
      loginAsPdg(): Chainable<void>;
    }
  }
}

export {};
