describe("Mboka Budget — US-21 Historique versements", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("enregistre l'historique des versements intermédiaires", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.fillStudioSessionDate(50);
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("2");
    cy.get("#totalAmount").clear().type("300");
    cy.get("#paidAmount").clear().type("100");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");

    cy.get('[data-testid="revenue-payment-history"]').should("be.visible");
    cy.get('[data-testid="revenue-payment-entry-0"]').should("contain", "Acompte initial");
    cy.get('[data-testid="revenue-payment-entry-0"]').should("contain", "100");

    cy.get("#paymentAmount").clear().type("50");
    cy.get('[data-testid="revenue-payment-submit"]').click();

    cy.location("search", { timeout: 15000 }).should("include", "paid=partial");
    cy.get('[data-testid="revenue-payment-entry-1"]').should("contain", "Versement complémentaire");
    cy.get('[data-testid="revenue-payment-entry-1"]').should("contain", "50");
    cy.get('[data-testid="revenue-detail-paid"]').should("contain", "150");
    cy.get('[data-testid="revenue-detail-remaining"]').should("contain", "150");
    cy.dismissToasts();
  });
});
