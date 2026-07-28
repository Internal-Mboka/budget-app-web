describe("Mboka Budget — US-28 Paies & cachets staff", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("enregistre un cachet staff et l'affiche dans l'historique personnel", () => {
    cy.visit("/expenses/new?category=PAIES_CACHETS_STAFF");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expense-staff-fields"]').should("be.visible");
    cy.get("#staffRecipientName").type("Marc Dupont");
    cy.get("#staffServiceDetails").type("Mix album XYZ");
    cy.get("#totalAmount").clear().type("150");
    cy.pickMbokaSelect("paymentMethod", "Espèces");
    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-staff-payroll-section"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="expense-staff-recipient"]').should("contain", "Marc Dupont");
    cy.get('[data-testid="expense-staff-service-details"]').should("contain", "Mix album XYZ");

    cy.visit("/expenses/staff");
    cy.get('[data-testid="expenses-staff-summary"]').should("be.visible");
    cy.get('[data-testid="expenses-staff-list"]').should("contain", "Marc Dupont");
    cy.dismissToasts();
  });
});
