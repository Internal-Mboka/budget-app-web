describe("Mboka Budget — SPEC 10 US-72 Solde caisse ouvert", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le KPI solde caisse ouvert dans le groupe Trésorerie", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-section-position"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-open-cash-balance"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-open-cash-balance-scope"]').should("contain.text", "Global");
    cy.contains("Espèces + Mobile Money").should("be.visible");
  });

  it("est visible sur la page financier dédiée", () => {
    cy.visit("/dashboard/financier");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-open-cash-balance"]').should("be.visible");
  });
});
