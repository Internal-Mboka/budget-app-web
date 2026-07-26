describe("Mboka Budget — US-16 Saisie revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la navigation revenus", () => {
    cy.visit("/revenues");
    cy.dismissPwaPrompt();
    cy.get('[data-testid="nav-revenues"]').should("be.visible");
    cy.get('[data-testid="revenues-sub-nav"]').should("be.visible");
    cy.contains("Registre des revenus").should("be.visible");
  });

  it("enregistre une session studio avec code transaction", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="revenue-create-form"]').should("be.visible");
    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");

    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("4");
    cy.get("#totalAmount").clear().type("250");
    cy.get("#paidAmount").clear().type("100");
    cy.get('[data-testid="revenue-status-preview"]').should("contain", "Réservé");

    cy.get('[data-testid="revenue-create-submit"]').click();

    cy.contains("Revenu TR-", { timeout: 15000 }).should("be.visible");
    cy.location("pathname").should("eq", "/revenues");
    cy.location("search").should("include", "created=TR-");
    cy.get('[data-testid^="revenue-row-TR-"]').should("have.length.at.least", 1);
    cy.dismissToasts();
  });
});
