describe("Mboka Budget — US-32 Clôture de caisse", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche les montants théoriques et valide une clôture conforme", () => {
    cy.visit("/cash-closing");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closing-form"]').should("be.visible");
    cy.get('[data-testid="cash-closing-theoretical-panel"]').should("be.visible");

    cy.get("#closingDate").clear().type("2099-06-15");
    cy.get("#openingCash").clear().type("0");
    cy.get("#openingMobileMoney").clear().type("0");
    cy.get("#realCash").type("0");
    cy.get("#realMobileMoney").type("0");
    cy.get('[data-testid="cash-closing-gap-preview"]').should("contain", "caisse conforme");
    cy.get('[data-testid="cash-closing-submit"]').click();

    cy.location("pathname", { timeout: 15000 }).should("match", /^\/cash-closing\//);
    cy.get('[data-testid="cash-closing-detail-panel"]').should("be.visible");
    cy.get('[data-testid="cash-closing-balanced-badge"]').should("be.visible");
    cy.dismissToasts();
  });

  it("affiche la navigation clôture caisse dans le menu", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="nav-cash-closing"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/cash-closing");
  });
});
