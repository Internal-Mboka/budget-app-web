describe("Mboka Budget — US-38 Approbation clôtures à écart", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la file de revue PDG dans la navigation clôture", () => {
    cy.visit("/cash-closing");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closing-subnav-approvals"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/cash-closing/approvals");
    cy.get('[data-testid="cash-closing-pending-reviews-panel"]').should("be.visible");
  });

  it("permet de valider une clôture à écart depuis la fiche détail", () => {
    const closingDate = "2026-12-31";

    cy.visit(`/cash-closing?date=${closingDate}`);
    cy.dismissPwaPrompt();

    cy.get('[data-testid="cash-closing-form"]').then(($form) => {
      if ($form.find('[data-testid="cash-closing-existing-banner"]').length > 0) {
        cy.get('[data-testid="cash-closing-existing-link"]').click();
      } else {
        cy.get("#openingCash").clear().type("0");
        cy.get("#openingMobileMoney").clear().type("0");
        cy.get("#realCash").clear().type("10");
        cy.get("#realMobileMoney").clear().type("0");
        cy.get("#notes").type("Test écart Cypress — billet manquant volontairement.");
        cy.get('[data-testid="cash-closing-submit"]').click();
      }
    });

    cy.get('[data-testid="cash-closing-review-section"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="cash-closing-review-status"]').should("contain", "En attente");

    cy.get("#reviewerInstruction").type("Écart analysé en test — aucune régularisation requise.");
    cy.get('[data-testid="cash-closing-review-approve"]').click();

    cy.get('[data-testid="cash-closing-review-status"]', { timeout: 15000 }).should(
      "contain",
      "analysé"
    );
    cy.dismissToasts();
  });
});
