describe("Mboka Budget — SPEC 8 US-60 Queue sync hors-ligne", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("met en file une saisie revenu hors-ligne puis l'envoie à la reconnexion", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.fillStudioSessionDate(45);

    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("4");
    cy.get("#totalAmount").clear().type("180");
    cy.get("#paidAmount").clear().type("50");

    cy.window().then((win) => {
      win.dispatchEvent(new Event("offline"));
    });

    cy.get('[data-testid="pwa-network-offline-banner"]').should("be.visible");
    cy.get('[data-testid="revenue-create-submit"]').click();

    cy.contains("enregistré sur cet appareil", { timeout: 10000 }).should("be.visible");
    cy.location("pathname").should("eq", "/revenues");

    cy.window().then((win) => {
      win.dispatchEvent(new Event("online"));
    });

    cy.get('[data-testid="pwa-network-reconnected-banner"]').should("be.visible");
    cy.contains("envoyé", { timeout: 20000 }).should("be.visible");
    cy.get('[data-testid="offline-sync-pending-count"]').should("not.exist");
  });
});
