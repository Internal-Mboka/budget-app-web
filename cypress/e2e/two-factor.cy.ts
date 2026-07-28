describe("Mboka Budget — US-08 Authentification 2FA", () => {
  it("redirige /login/two-factor vers /login sans défi actif", () => {
    cy.visit("/login/two-factor");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
  });

  describe("Compte DT", () => {
    beforeEach(function () {
      const email = Cypress.env("DT_EMAIL");
      const password = Cypress.env("DT_PASSWORD");

      if (!email || !password) {
        this.skip();
      }

      cy.loginAsDt();
    });

    it("connecte le DT sans étape 2FA si non activée", () => {
      cy.location("pathname").should("eq", "/dashboard");
    });

    it("affiche la navigation 2FA pour le DT", () => {
      cy.get('[data-testid="nav-two-factor"]')
        .should("exist")
        .and("have.attr", "href", "/account/two-factor");
    });

    it("affiche la page 2FA pour le DT", () => {
      cy.visit("/account/two-factor");
      cy.contains("Authentification 2FA").scrollIntoView().should("be.visible");
      cy.get('[data-testid="two-factor-status"]').should("be.visible");
      cy.get('[data-testid="begin-two-factor-setup"]').should("be.visible");
    });
  });
});
