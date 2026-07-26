describe("Mboka Budget — US-18 Échéanciers revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("enregistre un solde et marque la prestation réalisée", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.fillStudioSessionDate(47);
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("3");
    cy.get("#totalAmount").clear().type("200");
    cy.get("#paidAmount").clear().type("80");
    cy.get('[data-testid="revenue-status-preview"]').should("contain", "Réservé");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="revenue-detail-remaining"]').should("contain", "120");

    cy.get("#paymentAmount").clear().type("120");
    cy.get('[data-testid="revenue-payment-submit"]').click();

    cy.location("search", { timeout: 15000 }).should("include", "paid=solde");
    cy.get('[data-testid="revenue-status-badge-financial"]').should("contain", "Soldé");
    cy.get('[data-testid="revenue-detail-remaining"]').should("contain", "0");
    cy.get('[data-testid="revenue-payment-form-section"]').should("not.exist");

    cy.get('[data-testid="revenue-realized-submit"]').click();
    cy.location("search", { timeout: 15000 }).should("include", "realized=1");
    cy.get('[data-testid="revenue-status-badge-realized"]').should("contain", "Session réalisée");
    cy.get('[data-testid="revenue-realized-section"]').should("not.exist");
    cy.dismissToasts();
  });
});
