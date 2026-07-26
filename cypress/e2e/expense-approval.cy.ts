describe("Mboka Budget — US-29 Approbation dépenses seuil élevé", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le contrôle PDG pour une dépense au-dessus du seuil", () => {
    cy.visit("/expenses/new");
    cy.dismissPwaPrompt();

    cy.get("#label").type("Achat console mixing");
    cy.get("#totalAmount").clear().type("750");
    cy.pickMbokaSelect("paymentMethod", "Espèces");
    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-approval-section"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="expense-approval-status"]').should("contain", "Approuvée");
    cy.get('[data-testid="expense-detail-approval-badge"]').should("be.visible");
    cy.dismissToasts();
  });

  it("affiche la file d'approbation PDG dans la navigation dépenses", () => {
    cy.visit("/expenses");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expenses-subnav-approvals"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/expenses/approvals");
    cy.get('[data-testid="expense-pending-approvals-panel"]').should("be.visible");
  });
});
