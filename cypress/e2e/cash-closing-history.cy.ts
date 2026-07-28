describe("Mboka Budget — US-35 Historique clôtures", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le registre filtrable des clôtures", () => {
    cy.visit("/cash-closing/history");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closings-history-filters"]').should("be.visible");
    cy.get('[data-testid="cash-closings-history-table"]').should("exist");
    cy.get('[data-testid="cash-closing-history-back-link"]').should("be.visible");
  });

  it("permet d'accéder à l'historique complet depuis la clôture", () => {
    cy.visit("/cash-closing");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closings-history-full-link"]').click();
    cy.location("pathname").should("eq", "/cash-closing/history");
  });
});
