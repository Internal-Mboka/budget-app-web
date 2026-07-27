describe("Mboka Budget — SPEC 10 US-77 Expiration trimestre comptable", () => {
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

  it("passe automatiquement OPEN → CLOSING quand l'échéance est dépassée", () => {
    cy.task("expireOpenFiscalPeriod");
    cy.task("syncExpiredFiscalPeriods").should("eq", 1);

    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-banner"]').should("be.visible");
    cy.contains("Échéance du trimestre atteinte").should("be.visible");
    cy.get('[data-testid="fiscal-period-setup-banner"]').should("not.exist");
  });

  it("ne réaffiche pas le bandeau d'initialisation T1 pendant CLOSING", () => {
    cy.task("expireOpenFiscalPeriod");
    cy.task("syncExpiredFiscalPeriods");

    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-setup-banner"]').should("not.exist");
    cy.get('[data-testid="nav-fiscal-period-setup"]').should("not.exist");
  });
});
