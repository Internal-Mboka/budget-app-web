describe("Mboka Budget — US-20 PDF revenus", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("propose le téléchargement pro-forma et reçu sur la fiche revenu", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("metadataStudioRoom", "Salle A");
    cy.fillStudioSessionDate(49);
    cy.get('[data-testid="client-autocomplete-input"]').type("Doublon");
    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid^="client-autocomplete-option-"]').first().click();

    cy.get("#metadataDurationHours").clear().type("3");
    cy.get("#totalAmount").clear().type("180");
    cy.get("#paidAmount").clear().type("70");

    cy.get('[data-testid="revenue-create-submit"]').click();
    cy.get('[data-testid="revenue-detail-panel"]', { timeout: 15000 }).should("be.visible");

    cy.get('[data-testid="revenue-pdf-section"]').should("be.visible");
    cy.get('[data-testid="revenue-pdf-proforma-link"]').should("be.visible");
    cy.get('[data-testid="revenue-pdf-receipt-link"]').should("be.visible");

    cy.get('[data-testid="revenue-pdf-proforma-link"]')
      .invoke("attr", "href")
      .then((href) => {
        cy.request(href!).its("status").should("eq", 200);
        cy.request(href!).its("headers").its("content-type").should("include", "application/pdf");
      });

    cy.get('[data-testid="revenue-pdf-receipt-link"]')
      .invoke("attr", "href")
      .then((href) => {
        cy.request(href!).its("status").should("eq", 200);
        cy.request(href!).its("headers").its("content-type").should("include", "application/pdf");
      });
  });
});
