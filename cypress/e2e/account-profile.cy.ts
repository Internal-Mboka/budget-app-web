describe("Mboka Budget — Profil utilisateur", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("ouvre le profil au clic sur la carte utilisateur sans activer le thème", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="app-profile-link"]').click();
    cy.location("pathname").should("eq", "/account/profile");
    cy.get('[data-testid="account-profile-panel"]').should("be.visible");
    cy.contains("Mon profil").should("be.visible");
  });

  it("bascule le thème sans naviguer vers le profil", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="app-profile-theme-toggle"] [data-testid="theme-toggle"]').click();
    cy.location("pathname").should("eq", "/dashboard");
  });
});
