describe("Mboka Budget — REF-D01 Dashboard opérationnel", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la vue opérationnelle avec KPIs et actions rapides", () => {
    cy.visit("/dashboard/operations", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.dismissPwaPrompt();

    cy.contains("Vue opérationnelle").should("be.visible");
    cy.get('[data-testid="operations-quick-actions"]').should("be.visible");
    cy.get('[data-testid="operations-new-revenue"]').should("have.attr", "href", "/revenues/new");
    cy.get('[data-testid="operations-kpi-today-count"]').should("be.visible");
    cy.get('[data-testid="operations-kpi-pending"]').should("be.visible");
    cy.get('[data-testid="operations-recent-revenues"]').should("be.visible");
    cy.get('[data-testid="operations-today-bookings"]').should("be.visible");
  });
});

describe("Mboka Budget — REF-D02 Switcher vues dashboard", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le switcher dans la sidebar pour le DT", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-view-switcher"]').should("have.length.at.least", 1);
    cy.get('[data-testid="dashboard-view-dashboard"]').should("be.visible");
    cy.get('[data-testid="dashboard-view-dashboard-financier"]').should("be.visible");
    cy.get('[data-testid="dashboard-view-dashboard-operations"]').should("be.visible");
    cy.get('[data-testid="dashboard-view-dashboard-macro"]').should("be.visible");
  });

  it("navigue vers la vue financière via le switcher", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-view-dashboard-financier"]').first().click();
    cy.location("pathname").should("eq", "/dashboard/financier");
    cy.contains("Vue financière").should("be.visible");
  });

  it("navigue vers la vue opérationnelle via le switcher", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-view-dashboard-operations"]').first().click();
    cy.location("pathname").should("eq", "/dashboard/operations");
    cy.contains("Vue opérationnelle").should("be.visible");
  });
});
