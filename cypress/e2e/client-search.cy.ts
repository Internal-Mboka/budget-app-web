describe("Mboka Budget — US-11 Recherche clients", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("recherche et sélectionne un client existant", () => {
    const uniqueName = `Search Client ${Date.now()}`;

    cy.visit("/clients");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.get('[data-testid="client-search-panel"]').scrollIntoView();
    cy.get('[data-testid="client-autocomplete-input"]').clear().type(uniqueName.slice(0, 8).toLowerCase());

    cy.get('[data-testid="client-autocomplete-results"]', { timeout: 10000 }).should("be.visible");
    cy.contains('[data-testid^="client-autocomplete-option-"]', uniqueName)
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-testid="client-picker-selection"]').should("contain.text", uniqueName);
    cy.get('[data-testid="client-picker-selection"]').should("contain.text", "Particulier");
  });

  it("crée un client à la volée depuis l'autocomplétion", () => {
    const uniqueName = `Quick Client ${Date.now()}`;

    cy.visit("/clients");
    cy.get('[data-testid="client-search-panel"]').scrollIntoView();
    cy.get('[data-testid="client-autocomplete-input"]').type(uniqueName);
    cy.get('[data-testid="client-autocomplete-create"]', { timeout: 10000 })
      .scrollIntoView()
      .click({ force: true });

    cy.get('[data-testid="client-quick-create-dialog"]').should("be.visible");
    cy.get("#quickClientName").should("have.value", uniqueName);
    cy.get('[data-testid="quickClientCategory-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("quickClientCategory", "Entreprise / Marque");
    cy.contains("button", "Créer et sélectionner").click();

    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "créé");
    cy.dismissToasts();
    cy.get('[data-testid="client-picker-selection"]').should("contain.text", uniqueName);
    cy.get('[data-testid="client-picker-selection"]').should("contain.text", "Entreprise / Marque");
  });
});
