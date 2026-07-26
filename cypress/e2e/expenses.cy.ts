describe("Mboka Budget — US-25 Saisie dépenses", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la navigation dépenses", () => {
    cy.visit("/expenses");
    cy.dismissPwaPrompt();
    cy.get('[data-testid="nav-expenses"]').should("be.visible");
    cy.get('[data-testid="expenses-sub-nav"]').should("be.visible");
    cy.contains("Registre des dépenses").should("be.visible");
  });

  it("enregistre une dépense avec code transaction", () => {
    cy.visit("/expenses/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expense-create-form"]').should("be.visible");
    cy.pickMbokaSelect("expenseCategory", "Matériel & équipement");
    cy.get("#label").type("Achat câbles XLR");
    cy.get("#totalAmount").clear().type("85");
    cy.pickMbokaSelect("paymentMethod", "Espèces");

    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.location("pathname").should("match", /^\/expenses\/[^/]+$/);
    cy.location("search").should("include", "created=1");
    cy.get('[data-testid="expense-detail-label"]').should("contain", "Achat câbles XLR");
    cy.get('[data-testid="expense-detail-total"]').should("contain", "85");
    cy.get('[data-testid="expense-detail-payment-method"]').should("contain", "Espèces");
    cy.dismissToasts();
  });
});
