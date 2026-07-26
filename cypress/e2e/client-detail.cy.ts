describe("Mboka Budget — US-10 Fiche client", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la fiche client avec statistiques et filtre de statut", () => {
    const uniqueName = `Fiche Client ${Date.now()}`;

    cy.visit("/clients");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.contains("a", uniqueName)
      .scrollIntoView()
      .then(($link) => {
        const href = $link.attr("href");
        expect(href).to.match(/\/clients\/(?!optimistic)/);
        cy.visit(href!, { retryOnStatusCodeFailure: true, timeout: 30000 });
      });

    cy.url().should("match", /\/clients\/[a-z0-9]+$/);
    cy.contains("h1", uniqueName).should("be.visible");
    cy.get('[data-testid="client-stat-total-spent"]').should("contain.text", "Total encaissé");
    cy.get('[data-testid="client-stat-balance-due"]').should("contain.text", "Solde restant dû");
    cy.get('[data-testid="client-transactions-empty"]').should(
      "contain.text",
      "Aucune transaction enregistrée"
    );

    cy.get('[data-testid="statusFilter-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("statusFilter", "Soldé");
    cy.get('[data-testid="statusFilter-trigger"]').should("contain", "Soldé");

    cy.contains("Retour au répertoire").click();
    cy.url().should("include", "/clients");
  });
});
