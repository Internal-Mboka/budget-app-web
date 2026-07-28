describe("Mboka Budget — SPEC 10 US-76 Verrous trimestre comptable", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.task("resetFiscalPeriodOpen");
    cy.loginAsDt();
  });

  afterEach(() => {
    cy.task("resetFiscalPeriodOpen");
  });

  it("affiche le bandeau de clôture trimestrielle quand le statut est CLOSING", () => {
    cy.task("setFiscalPeriodStatus", "CLOSING");

    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-banner"]').should("be.visible");
    cy.contains("saisies financières sont figées").should("be.visible");
  });

  it("masque le bandeau quand le trimestre est OPEN", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-banner"]').should("not.exist");
  });
});
