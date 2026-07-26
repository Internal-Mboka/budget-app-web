describe("Mboka Budget — US-15 Historique interactions & notes client", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("ajoute une note depuis la fiche client", () => {
    const uniqueName = `Note Detail ${Date.now()}`;
    const noteContent = "Accord remise 10 % validé par le DT.";

    cy.visit("/clients?pageSize=100");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.dismissToasts();

    cy.contains("a", uniqueName)
      .scrollIntoView()
      .then(($link) => {
        cy.visit($link.attr("href")!, { retryOnStatusCodeFailure: true, timeout: 30000 });
      });

    cy.get('[data-testid="client-interactions-section"]').scrollIntoView();
    cy.get('[data-testid="client-note-input"]').type(noteContent);
    cy.get('[data-testid="client-note-submit"]').click();
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistrée");
    cy.dismissToasts();

    cy.get('[data-testid="client-notes-list"]').should("contain.text", noteContent);
  });

  it("ajoute une note depuis le répertoire via le dialog", () => {
    const uniqueName = `Note List ${Date.now()}`;
    const noteContent = "Relance effectuée par téléphone.";

    cy.visit("/clients?pageSize=100");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Artiste indépendant");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.dismissToasts();

    cy.contains("article", uniqueName).within(() => {
      cy.contains("button", "Notes").click();
    });

    cy.get('[data-testid="client-interactions-dialog"]').should("be.visible");
    cy.get('[data-testid="client-note-input"]').type(noteContent);
    cy.get('[data-testid="client-note-submit"]').click();
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistrée");
    cy.dismissToasts();
    cy.get('[data-testid="client-notes-list"]').should("contain.text", noteContent);
  });
});
