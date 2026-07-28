describe("Mboka Budget — SPEC 10 US-68 Toggle portée KPI", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le switch Période / Global sur les indicateurs Activité", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-scope-switch"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-scope-switch-period"]').should("have.attr", "aria-current", "page");
    cy.get('[data-testid="dashboard-kpi-revenue-scope"]').should("contain.text", "Période");
    cy.get('[data-testid="dashboard-kpi-revenue-delta"]').should("be.visible");
  });

  it("bascule en mode Global et met à jour les badges Activité", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-scope-switch-global"]').click();
    cy.location("search").should("include", "kpiScope=global");
    cy.get('[data-testid="dashboard-kpi-scope-switch-global"]').should("have.attr", "aria-current", "page");
    cy.get('[data-testid="dashboard-kpi-revenue-scope"]').should("contain.text", "Global");
    cy.get('[data-testid="dashboard-kpi-expenses-scope"]').should("contain.text", "Global");
    cy.get('[data-testid="dashboard-kpi-treasury-scope"]').should("contain.text", "Global");
    cy.get('[data-testid="dashboard-kpi-revenue-delta"]').should("not.exist");
    cy.get('[data-testid="dashboard-kpi-expenses-delta"]').should("not.exist");
    cy.contains("Activité cumulée").should("be.visible");
  });

  it("désactive le filtre période des indicateurs en mode Global", () => {
    cy.visit("/dashboard?kpiScope=global");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-period-switch"]').should("be.visible").and("have.attr", "data-disabled", "true");
    cy.get('[data-testid="dashboard-kpi-period-switch-month"]').should("have.attr", "aria-disabled", "true");
    cy.get('[data-testid="dashboard-granularity-switch"]').should("be.visible").and("not.have.attr", "data-disabled");
  });

  it("préserve kpiScope lors d'un changement de granularité", () => {
    cy.visit("/dashboard?kpiScope=global");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-granularity-day"]').click();
    cy.location("search").should("include", "kpiScope=global");
    cy.location("search").should("include", "granularity=day");
  });
});
