describe("Mboka Budget — Accès public", () => {
  it("redirige la page d'accueil vers /login si non authentifié", () => {
    cy.visit("/");
    cy.location("pathname").should("eq", "/login");
  });

  it("affiche le formulaire de connexion", () => {
    cy.visit("/login");
    cy.contains("Connexion").should("be.visible");
    cy.get("#email").should("be.visible");
    cy.get("#password").should("be.visible");
    cy.contains("button", "Se connecter").should("be.visible");
  });
});

describe("Mboka Budget — US-01 Connexion", () => {
  it("refuse des identifiants invalides", () => {
    cy.visit("/login");
    cy.dismissPwaPrompt();
    cy.dismissToasts();

    cy.get("#email").type("invalid@example.com");
    cy.get("#password").type("wrong-password");
    cy.contains("button", "Se connecter").click();

    cy.contains("Identifiants incorrects", { timeout: 10000 }).should("be.visible");
    cy.location("pathname").should("eq", "/login");
    cy.dismissToasts();
  });

  it("connecte le Directeur Technique et redirige vers le dashboard complet", function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.visit("/login");
    cy.dismissPwaPrompt();
    cy.dismissToasts();
    cy.get("#email").type(email);
    cy.get("#password").type(password);
    cy.contains("button", "Se connecter").click();

    cy.location("pathname", { timeout: 15000 }).should("eq", "/dashboard");
    cy.contains("Vue complète").should("be.visible");
    cy.dismissToasts();
  });
});

describe("Mboka Budget — US-05 Déconnexion", () => {
  it("déconnecte l'utilisateur et renvoie vers /login", function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
    cy.get('[data-testid="app-logout"]').scrollIntoView().click({ force: true });
    cy.location("pathname", { timeout: 15000 }).should("eq", "/login");
  });
});
