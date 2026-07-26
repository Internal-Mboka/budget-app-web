describe("Mboka Budget — US-04 Mot de passe", () => {
  it("affiche la page mot de passe oublié", () => {
    cy.visit("/login/forgot-password");
    cy.contains("Mot de passe oublié").should("be.visible");
    cy.get("#email").should("be.visible");
  });

  it("accepte une demande de réinitialisation", () => {
    cy.visit("/login/forgot-password");
    cy.dismissPwaPrompt();
    cy.get("#email").type(Cypress.env("DT_EMAIL"));
    cy.contains("button", "Envoyer le lien").click();
    cy.location("pathname").should("eq", "/login");
    cy.contains("lien de réinitialisation").should("be.visible");
  });

  it("affiche la page changement de mot de passe pour un utilisateur connecté", function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
    cy.visit("/account/password");
    cy.get("main").contains("h1", "Mot de passe").scrollIntoView().should("be.visible");
    cy.get("#newPassword").should("be.visible");
    cy.get("#confirmPassword").should("be.visible");
  });

  it("affiche le lien mot de passe oublié sur la page login", () => {
    cy.visit("/login");
    cy.dismissPwaPrompt();
    cy.contains("a", "Mot de passe oublié ?").should("be.visible");
  });
});
