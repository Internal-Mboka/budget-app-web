describe("Mboka Budget — US-31 Avances de caisse / notes de frais", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("soumet une demande d'avance et affiche la page de suivi", () => {
    cy.visit("/expenses/advances/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expense-cash-advance-create-form"]').should("be.visible");
    cy.get("#purpose").type("Achat urgent câbles studio");
    cy.get("#totalAmount").clear().type("85");
    cy.pickMbokaSelect("paymentMethod", "Espèces");
    cy.get('[data-testid="expense-cash-advance-create-submit"]').click();

    cy.get('[data-testid="expense-cash-advance-section"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="expense-cash-advance-status"]').should("contain", "Approuvée");
    cy.dismissToasts();
  });

  it("affiche l'onglet avances dans la navigation dépenses", () => {
    cy.visit("/expenses");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expenses-subnav-advances"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/expenses/advances");
    cy.get('[data-testid="expense-cash-advance-list-section"]').should("be.visible");
  });
});
