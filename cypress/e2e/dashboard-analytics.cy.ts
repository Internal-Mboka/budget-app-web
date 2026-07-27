describe("Mboka Budget — SPEC 7 US-46 Dashboard financier global", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche les KPI et le graphique Revenus vs Dépenses", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.contains("Vue complète").should("be.visible");
    cy.get('[data-testid="dashboard-updated-at"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-grid"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-revenue"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-expenses"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-receivables"]').should("be.visible");
    cy.get('[data-testid="dashboard-revenue-expense-chart"]').should("be.visible");
    cy.get('[data-testid="dashboard-granularity-switch"]').should("be.visible");
  });

  it("permet de changer la granularité du graphique", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-granularity-day"]').click();
    cy.location("search").should("include", "granularity=day");
    cy.get('[data-testid="dashboard-revenue-expense-chart"]').should("be.visible");

    cy.get('[data-testid="dashboard-granularity-week"]').click();
    cy.location("search").should("include", "granularity=week");

    cy.get('[data-testid="dashboard-granularity-month"]').click();
    cy.location("search").should("not.include", "granularity=");
  });
});
