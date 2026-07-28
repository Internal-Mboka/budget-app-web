describe("Mboka Budget — US-23 Remises revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("applique une remise en pourcentage et génère un PDF avec le détail tarifaire", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="revenue-discount-section"]').should("be.visible");

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.fillStudioSessionDate(61);
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("2");
    cy.get("#baseAmount").clear().type("200");
    cy.pickMbokaSelect("discountType", "Pourcentage (%)");
    cy.get("#discountValue").clear().type("10");
    cy.get("#totalAmount").should("have.value", "180");
    cy.get("#paidAmount").clear().type("50");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="revenue-detail-total"]').should("contain", "180");

    cy.get('[data-testid="revenue-pdf-proforma-link"]')
      .invoke("attr", "href")
      .then((href) => {
        cy.request(href!).its("status").should("eq", 200);
      });

    cy.dismissToasts();
  });
});
