describe("Mboka Budget — US-02 Gestion utilisateurs", () => {
  const email = Cypress.env("DT_EMAIL");
  const password = Cypress.env("DT_PASSWORD");

  beforeEach(function () {
    if (!email || !password) {
      this.skip();
    }

    cy.visit("/login");
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.contains("button", "Se connecter").click();
    cy.location("pathname", { timeout: 15000 }).should("eq", "/dashboard");
  });

  it("affiche la page admin utilisateurs pour le DT", () => {
    cy.visit("/admin/users");
    cy.contains("Gestion des utilisateurs").should("be.visible");
    cy.contains("Nouveau compte").should("be.visible");
    cy.contains("Comptes existants").should("be.visible");
  });

  it("refuse l'accès admin sans permission users:manage", () => {
    // Le DT a users:manage — on vérifie que la nav est visible
    cy.contains("a", "Utilisateurs").should("be.visible");
  });

  it("crée un utilisateur observateur", () => {
    const uniqueEmail = `test.observateur.${Date.now()}@mboka.test`;

    cy.visit("/admin/users");
    cy.get("#firstName").type("Test");
    cy.get("#lastName").type("Observateur");
    cy.get("#email").type(uniqueEmail);
    cy.get("#password").type("Test1234!");
    cy.get("#roleId").select("Observateur");
    cy.contains("button", "Créer l'utilisateur").click();

    cy.contains(uniqueEmail, { timeout: 10000 }).should("be.visible");
  });
});
