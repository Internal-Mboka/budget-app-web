describe("Mboka Budget — US-30 Dépenses récurrentes", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("configure un modèle récurrent et affiche la page de suivi", () => {
    cy.visit("/expenses/recurring/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expense-recurring-create-form"]').should("be.visible");
    cy.get("#label").type("Loyer studio");
    cy.pickMbokaSelect("expenseCategory", "Loyer & charges fixes");
    cy.pickMbokaSelect("recurringPeriod", "Mensuelle");
    cy.get("#totalAmount").clear().type("1200");
    cy.pickMbokaSelect("paymentMethod", "Virement bancaire");
    cy.get('[data-testid="expense-recurring-create-submit"]').click();

    cy.location("pathname", { timeout: 15000 }).should("eq", "/expenses/recurring");
    cy.get('[data-testid="expense-recurring-templates-list"]').should("contain", "Loyer studio");
    cy.dismissToasts();
  });

  it("affiche l'onglet récurrentes dans la navigation dépenses", () => {
    cy.visit("/expenses");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="expenses-subnav-recurring"]').should("be.visible").click();
    cy.location("pathname").should("eq", "/expenses/recurring");
    cy.get('[data-testid="expense-recurring-templates-section"]').should("be.visible");
  });
});
