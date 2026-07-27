describe("Mboka Budget — SPEC 8 US-59 Historique exports", () => {
  beforeEach(function () {
    const email = Cypress.env("PDG_EMAIL") || Cypress.env("DT_EMAIL");
    const password = Cypress.env("PDG_PASSWORD") || Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    if (Cypress.env("PDG_EMAIL")) {
      cy.loginAsPdg();
    } else {
      cy.loginAsDt();
    }
  });

  it("affiche l'historique des exports et permet de filtrer", () => {
    cy.visit("/exports");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="exports-history-link"]').click();
    cy.location("pathname").should("eq", "/exports/history");
    cy.get('[data-testid="exports-history-filters"]').should("be.visible");
    cy.get('[data-testid="exports-history-table"]').should("exist");
  });
});
