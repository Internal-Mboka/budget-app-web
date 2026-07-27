describe("Mboka Budget — SPEC 10 US-69 Encaissements réels", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la carte encaissements réels avec hint période", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-cash-collections"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-cash-collections-scope"]').should("contain.text", "Période");
    cy.contains("Encaissements réels ·").should("be.visible");
  });

  it("adapte la carte encaissements en mode Global", () => {
    cy.visit("/dashboard?kpiScope=global");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-cash-collections"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-cash-collections-scope"]').should("contain.text", "Global");
    cy.contains("Encaissements réels · cumul historique").should("be.visible");
  });
});
