describe("Mboka Budget — SPEC 10 US-70 Mode comptable", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le switch Engagement / Encaissement", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-accounting-mode-switch"]').should("be.visible");
    cy.get('[data-testid="dashboard-accounting-mode-switch-accrual"]').should("have.attr", "aria-current", "page");
    cy.contains("Montants basés sur la date d'enregistrement").should("be.visible");
  });

  it("bascule en mode Encaissement et conserve le paramètre URL", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-accounting-mode-switch-cash"]').click();
    cy.location("search").should("include", "accountingMode=cash");
    cy.get('[data-testid="dashboard-accounting-mode-switch-cash"]').should("have.attr", "aria-current", "page");
    cy.contains("Montants basés sur les dates de paiement").should("be.visible");
  });

  it("préserve accountingMode lors d'un changement de granularité", () => {
    cy.visit("/dashboard?accountingMode=cash");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-granularity-week"]').click();
    cy.location("search").should("include", "accountingMode=cash");
    cy.location("search").should("include", "granularity=week");
  });
});
