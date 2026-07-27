describe("Mboka Budget — SPEC 10 US-75 Onboarding trimestre comptable", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("refuse l'accès à /dashboard/setup au DT (réservé PDG)", () => {
    cy.visit("/dashboard/setup", { failOnStatusCode: false });
    cy.dismissPwaPrompt();

    cy.location("pathname", { timeout: 15000 }).should("eq", "/dashboard");
    cy.location("search").should("include", "error=forbidden");
  });

  it("affiche le bandeau d'initialisation si aucun trimestre OPEN", function () {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get("body").then(($body) => {
      if ($body.find('[data-testid="fiscal-period-setup-banner"]').length > 0) {
        cy.get('[data-testid="fiscal-period-setup-banner"]').should("be.visible");
        cy.get('[data-testid="fiscal-period-setup-banner-link"]').should("not.exist");
        cy.contains("Seul le PDG peut ouvrir").should("be.visible");
      } else {
        cy.log("Trimestre OPEN déjà présent (SEED_FISCAL_PERIOD) — bandeau masqué.");
      }
    });
  });
});
