describe("Mboka Budget — US-19 Annulations revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("annule un revenu en conservant l'acompte comme pénalité", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle B");
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("2");
    cy.get("#totalAmount").clear().type("150");
    cy.get("#paidAmount").clear().type("60");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");

    cy.get('[data-testid="revenue-cancellation-section"]').should("be.visible");
    cy.get("#cancellationReason").type("No-show client — annulation tardive");
    cy.pickMbokaSelect("penaltyMode", "Conserver l'acompte (no-show)");
    cy.get('[data-testid="revenue-cancellation-preview"]').should("contain", "Pénalité");
    cy.get('[data-testid="revenue-cancellation-submit"]').click();

    cy.location("search", { timeout: 15000 }).should("include", "cancelled=1");
    cy.get('[data-testid="revenue-status-badge-litige"]').should("contain", "Litige");
    cy.get('[data-testid="revenue-cancellation-info"]').should("be.visible");
    cy.get('[data-testid="revenue-cancellation-reason"]').should("contain", "No-show client");
    cy.get('[data-testid="revenue-detail-paid"]').should("contain", "60");
    cy.get('[data-testid="revenue-detail-remaining"]').should("contain", "0");
    cy.get('[data-testid="revenue-payment-form-section"]').should("not.exist");
    cy.get('[data-testid="revenue-cancellation-section"]').should("not.exist");
    cy.dismissToasts();
  });
});
