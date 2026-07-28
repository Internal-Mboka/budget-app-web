describe("Mboka Budget — SPEC 8 US-54 Alertes critiques", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("enregistre une dépense above seuil sans erreur (alerte async)", () => {
    cy.visit("/expenses/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expense-create-form"]').should("be.visible");
    cy.pickMbokaSelect("expenseCategory", "Matériel & équipement");
    cy.get("#label").type("Alerte seuil test");
    cy.get("#totalAmount").clear().type("750");
    cy.pickMbokaSelect("paymentMethod", "Espèces");

    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.location("pathname").should("match", /^\/expenses\/[^/]+$/);
  });
});
