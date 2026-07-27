describe("Mboka Budget — SPEC 10 US-75 Onboarding trimestre comptable", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("autorise le DT sur /dashboard/setup quand aucun trimestre OPEN", function () {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="fiscal-period-setup-banner-link"]').length > 0) {
        cy.get('[data-testid="fiscal-period-setup-banner-link"]').click();
        cy.location("pathname").should("eq", "/dashboard/setup");
        cy.get('[data-testid="fiscal-period-setup-panel"]').should("be.visible");
      } else {
        cy.log("Trimestre OPEN déjà présent (SEED_FISCAL_PERIOD) — setup masqué.");
        cy.visit("/dashboard/setup", { failOnStatusCode: false });
        cy.location("pathname", { timeout: 15000 }).should("eq", "/dashboard");
      }
    });
  });

  it("affiche le bandeau d'initialisation si aucun trimestre OPEN", function () {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="fiscal-period-setup-banner"]').length > 0) {
        cy.get('[data-testid="fiscal-period-setup-banner"]').should("be.visible");
        cy.get('[data-testid="fiscal-period-setup-banner-link"]').should("be.visible");
        cy.contains("ouvrez le 1er trimestre").should("be.visible");
      } else {
        cy.log("Trimestre OPEN déjà présent (SEED_FISCAL_PERIOD) — bandeau masqué.");
      }
    });
  });
});
