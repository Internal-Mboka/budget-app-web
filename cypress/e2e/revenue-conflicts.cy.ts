describe("Mboka Budget — US-24 Conflits réservation", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("refuse une deuxième réservation sur le même créneau", () => {
    const conflictDate = "2030-06-15";

    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.get("#metadataSessionDate").clear().type(conflictDate);
    cy.get("#metadataSessionStartTime").clear().type("09:00");
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("4");
    cy.get("#totalAmount").clear().type("300");
    cy.get("#paidAmount").clear().type("0");
    cy.get('[data-testid="revenue-create-submit"]').click();

    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.dismissToasts();

    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.get("#metadataSessionDate").clear().type(conflictDate);
    cy.get("#metadataSessionStartTime").clear().type("09:00");
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("4");
    cy.get("#totalAmount").clear().type("250");
    cy.get("#paidAmount").clear().type("0");
    cy.get('[data-testid="revenue-create-submit"]').click();

    cy.contains("Créneau déjà occupé", { timeout: 15000 }).should("be.visible");
    cy.location("pathname").should("eq", "/revenues/new");
    cy.dismissToasts();
  });
});
