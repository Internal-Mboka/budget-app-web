describe("Mboka Budget — US-17 Anti-doublon revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("verrouille le bouton pendant la soumission", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("2");
    cy.get("#totalAmount").clear().type("175");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-create-submit"]').should("have.attr", "data-pending", "true");
    cy.get('[data-testid="revenue-create-submit"]').should("be.disabled");
    cy.contains("Enregistrement...", { timeout: 10000 }).should("be.visible");

    cy.location("pathname", { timeout: 20000 }).should("eq", "/revenues");
    cy.dismissToasts();
  });
});
