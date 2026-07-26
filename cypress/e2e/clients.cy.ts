describe("Mboka Budget — US-09 Répertoire clients", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page clients pour le DT", () => {
    cy.visit("/clients", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.contains("Répertoire clients").scrollIntoView().should("be.visible");
    cy.get('[data-testid="client-create-form"]').should("be.visible");
  });

  it("affiche la navigation clients", () => {
    cy.get('[data-testid="nav-clients"]')
      .should("exist")
      .and("have.attr", "href", "/clients");
  });

  it("crée un client artiste indépendant", () => {
    const uniqueName = `Test Artiste ${Date.now()}`;

    cy.visit("/clients");
    cy.get("#name").type(uniqueName);
    cy.pickMbokaSelect("category", "Artiste indépendant");
    cy.get("#phone").type("+243900000001");
    cy.get("#email").type(`test.${Date.now()}@mboka.test`);
    cy.contains("button", "Enregistrer le client").click();

    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.contains("Artiste indépendant").should("be.visible");
    cy.dismissToasts();
  });

  it("refuse un doublon de nom", () => {
    const uniqueName = `Doublon Client ${Date.now()}`;

    cy.visit("/clients");
    cy.get("#name").type(uniqueName);
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.reload();
    cy.get("#name").type(uniqueName);
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "existe déjà");
    cy.dismissToasts();
  });
});
