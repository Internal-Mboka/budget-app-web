describe("Mboka Budget — US-02 Gestion utilisateurs", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page admin utilisateurs pour le DT", () => {
    cy.visit("/admin/users", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.contains("Gestion des utilisateurs").scrollIntoView().should("be.visible");
    cy.contains("Nouveau compte").scrollIntoView().should("be.visible");
    cy.contains("Comptes existants").scrollIntoView().should("be.visible");
  });

  it("affiche la navigation utilisateurs pour le DT", () => {
    cy.get('[data-testid="nav-utilisateurs"]')
      .should("exist")
      .and("have.attr", "href", "/admin/users");
  });

  it("crée un utilisateur observateur", () => {
    const uniqueEmail = `test.observateur.${Date.now()}@mboka.test`;

    cy.visit("/admin/users");
    cy.get("#firstName").type("Test");
    cy.get("#lastName").type("Observateur");
    cy.get("#email").type(uniqueEmail);
    cy.get("#password").type("Test1234!", { force: true });
    cy.pickMbokaSelect("roleId", "Observateur");
    cy.contains("button", "Créer l'utilisateur").click();

    cy.contains(uniqueEmail, { timeout: 10000 }).scrollIntoView().should("be.visible");
    cy.dismissToasts();
  });
});
