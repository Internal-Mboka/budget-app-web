describe("Mboka Budget — US-33 Responsabilisation opérateur clôture", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche l'opérateur sur la fiche après clôture", () => {
    cy.visit("/cash-closing");
    cy.dismissPwaPrompt();

    cy.get("#closingDate").clear().type("2099-12-01");
    cy.get("#openingCash").clear().type("0");
    cy.get("#openingMobileMoney").clear().type("0");
    cy.get("#realCash").type("0");
    cy.get("#realMobileMoney").type("0");
    cy.get('[data-testid="cash-closing-submit"]').click();

    cy.location("pathname", { timeout: 15000 }).should("match", /^\/cash-closing\//);
    cy.get('[data-testid="cash-closing-operator-card"]').should("be.visible");
    cy.get('[data-testid="cash-closing-operator-name"]').should("contain", "Prince");
    cy.dismissToasts();
  });

  it("affiche l'historique avec opérateur identifié", () => {
    cy.visit("/cash-closing");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closings-history-panel"]').should("be.visible");
    cy.get('[data-testid="cash-closings-history-list"]').should("exist");
  });
});
