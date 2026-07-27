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
    cy.get('[data-testid="dashboard-kpi-period-switch"]').should("be.visible");
    cy.get('[data-testid="dashboard-granularity-switch"]').should("be.visible");
  });

  it("permet de changer la période des KPI et la granularité du graphique", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-period-switch-quarter"]').click();
    cy.location("search").should("include", "kpiPeriod=quarter");

    cy.get('[data-testid="dashboard-kpi-period-switch-year"]').click();
    cy.location("search").should("include", "kpiPeriod=year");

    cy.get('[data-testid="dashboard-granularity-day"]').click();
    cy.location("search").should("include", "granularity=day");

    cy.get('[data-testid="dashboard-granularity-quarter"]').click();
    cy.location("search").should("include", "granularity=quarter");

    cy.get('[data-testid="dashboard-revenue-expense-chart"]').should("be.visible");
  });
});

describe("Mboka Budget — SPEC 7 US-48 Ventilation CA par activité", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le graphique CA par activité avec filtre de période", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-revenue-breakdown-panel"]').should("be.visible");
    cy.get('[data-testid="dashboard-revenue-by-category-chart"]').should("be.visible");
    cy.get('[data-testid="dashboard-category-period-switch"]').should("be.visible");

    cy.get('[data-testid="dashboard-category-period-switch-quarter"]').click();
    cy.location("search").should("include", "categoryPeriod=quarter");
    cy.get('[data-testid="dashboard-revenue-by-category-chart"]').should("be.visible");

    cy.get('[data-testid="dashboard-category-period-switch-year"]').click();
    cy.location("search").should("include", "categoryPeriod=year");
  });
});

describe("Mboka Budget — SPEC 7 US-47 Vue macro Observateur", () => {
  beforeEach(function () {
    const email = Cypress.env("OBSERVATEUR_EMAIL");
    const password = Cypress.env("OBSERVATEUR_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.visit("/login");
    cy.dismissPwaPrompt();
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.contains("button", "Se connecter").click();
    cy.location("pathname", { timeout: 20000 }).should("eq", "/dashboard/macro");
  });

  it("affiche les indicateurs macro agrégés sans détail opérationnel", () => {
    cy.visit("/dashboard/macro");
    cy.dismissPwaPrompt();

    cy.contains("Vue macro").should("be.visible");
    cy.get('[data-testid="dashboard-macro-updated-at"]').should("be.visible");
    cy.get('[data-testid="dashboard-macro-kpi-revenue"]').should("be.visible");
    cy.get('[data-testid="dashboard-macro-kpi-margin"]').should("be.visible");
    cy.get('[data-testid="dashboard-macro-kpi-occupancy"]').should("be.visible");
    cy.get('[data-testid="dashboard-macro-revenue-trend"]').should("be.visible");
    cy.get('[data-testid="dashboard-macro-period-switch"]').should("be.visible");
  });
});
