describe("Mboka Budget — US-26 Avoirs & régularisations", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("émet une régularisation partielle sur une dépense sans supprimer l'origine", () => {
    cy.visit("/expenses/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("expenseCategory", "Matériel & équipement");
    cy.get("#label").type("Erreur test US-26");
    cy.get("#totalAmount").clear().type("120");
    cy.pickMbokaSelect("paymentMethod", "Espèces");
    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="transaction-adjustments-section"]').should("be.visible");

    cy.get("#adjustmentAmount").clear().type("20");
    cy.get("#adjustmentReason").type("Correction erreur de saisie");
    cy.get('[data-testid="transaction-adjustment-submit"]').click();

    cy.location("search", { timeout: 15000 }).should("include", "adjusted=1");
    cy.get('[data-testid="transaction-adjustments-list"]').should("be.visible");
    cy.get('[data-testid="transaction-net-amount"]').should("contain", "100");
    cy.get('[data-testid="expense-detail-total"]').should("contain", "100");
    cy.dismissToasts();
  });
});
