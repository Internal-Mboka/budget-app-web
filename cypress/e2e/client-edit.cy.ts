describe("Mboka Budget — US-12 Mise à jour fiche client", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("met à jour un client depuis le répertoire", () => {
    const uniqueName = `Edit List ${Date.now()}`;
    const updatedPhone = `+243900${String(Date.now()).slice(-6)}`;

    cy.visit("/clients");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.contains("article", uniqueName).within(() => {
      cy.contains("button", "Modifier").click();
    });

    cy.get('[data-testid="client-edit-dialog"]').should("be.visible");
    cy.get("#client-edit-dialog-form-phone").clear().type(updatedPhone);
    cy.get("#client-edit-dialog-form-notes").type("Accord tarif préférentiel studio.");
    cy.contains("button", "Enregistrer les modifications").click({ force: true });

    cy.get("[data-sonner-toast]", { timeout: 20000 }).should("contain.text", "mise à jour");
    cy.dismissToasts();
    cy.contains("article", uniqueName).should("contain.text", updatedPhone);
  });

  it("met à jour un client depuis la fiche détail sans perdre l'historique", () => {
    const uniqueName = `Edit Detail ${Date.now()}`;
    const updatedNotes = "Client fidèle — relance douce si retard.";

    cy.visit("/clients");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Artiste indépendant");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.contains("a", uniqueName)
      .scrollIntoView()
      .then(($link) => {
        cy.visit($link.attr("href")!, { retryOnStatusCodeFailure: true, timeout: 30000 });
      });

    cy.get('[data-testid="client-edit-section"]').scrollIntoView();
    cy.get("#client-detail-edit-form-notes").clear().type(updatedNotes);
    cy.contains("button", "Enregistrer les modifications").click();

    cy.get("[data-sonner-toast]", { timeout: 20000 }).should("contain.text", "mise à jour");
    cy.dismissToasts();
    cy.contains(updatedNotes).scrollIntoView().should("be.visible");
    cy.get('[data-testid="client-transactions-empty"]').should(
      "contain.text",
      "Aucun revenu ni dépense enregistré"
    );
  });
});
