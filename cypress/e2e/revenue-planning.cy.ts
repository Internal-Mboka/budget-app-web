describe("Mboka Budget — US-22 Planning revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le planning après enregistrement d'une session studio", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle C");
    cy.fillStudioSessionDate(60);
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("3");
    cy.get("#totalAmount").clear().type("220");
    cy.get("#paidAmount").clear().type("0");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");

    cy.get('[data-testid="revenue-detail-panel"]')
      .contains("TR-")
      .invoke("text")
      .then((code) => {
        cy.visit("/revenues/planning");
        cy.dismissPwaPrompt();

        cy.get('[data-testid="revenues-subnav-planning"]').should("be.visible");
        cy.get('[data-testid="revenues-planning"]').should("be.visible");
        cy.get(`[data-testid="planning-booking-${code.trim()}"]`).should("be.visible");
        cy.get(`[data-testid="planning-booking-${code.trim()}"]`).should("contain", "Salle C");
      });

    cy.dismissToasts();
  });
});
