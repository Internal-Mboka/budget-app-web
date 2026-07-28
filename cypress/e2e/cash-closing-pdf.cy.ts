describe("Mboka Budget — US-37 Ticket Z clôture", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche les liens d'impression sur la fiche de clôture", () => {
    cy.visit("/cash-closing/history");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closings-history-table"]').then(($table) => {
      if ($table.find('[data-testid^="cash-closing-history-table-link-"]').length === 0) {
        cy.log("Aucune clôture en base — test ignoré.");
        return;
      }

      cy.get('[data-testid^="cash-closing-history-table-link-"]').first().click();
      cy.get('[data-testid="cash-closing-pdf-section"]').should("be.visible");
      cy.get('[data-testid="cash-closing-pdf-thermal-link"]').should("be.visible");
      cy.get('[data-testid="cash-closing-pdf-a4-link"]').should("be.visible");

      cy.get('[data-testid="cash-closing-pdf-thermal-link"]')
        .should("have.attr", "href")
        .and("include", "/api/cash-closing/")
        .and("include", "format=thermal");
    });
  });
});
