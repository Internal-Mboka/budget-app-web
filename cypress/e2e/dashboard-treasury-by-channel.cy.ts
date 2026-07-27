describe("Mboka Budget — SPEC 10 US-73 Trésorerie par canal", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la ventilation par canal sous Trésorerie nette", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="dashboard-kpi-treasury"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury-breakdown"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury-channel-cash"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury-channel-mobile_money"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury-channel-virement_bancaire"]').should("be.visible");
    cy.get('[data-testid="dashboard-kpi-treasury-channel-autre"]').should("be.visible");
    cy.contains("Espèces").should("be.visible");
    cy.contains("Mobile Money").should("be.visible");
    cy.contains("Virement bancaire").should("be.visible");
  });
});
