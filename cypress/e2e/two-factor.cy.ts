describe("Mboka Budget — US-08 Authentification 2FA", () => {
  it("redirige /login/two-factor vers /login sans défi actif", () => {
    cy.visit("/login/two-factor");
    cy.location("pathname", { timeout: 10000 }).should("eq", "/login");
  });

  describe("Compte DT (2FA non disponible)", () => {
    beforeEach(function () {
      const email = Cypress.env("DT_EMAIL");
      const password = Cypress.env("DT_PASSWORD");

      if (!email || !password) {
        this.skip();
      }

      cy.loginAsDt();
    });

    it("connecte le DT sans étape 2FA", () => {
      cy.location("pathname").should("eq", "/dashboard");
    });

    it("masque la navigation 2FA pour le DT", () => {
      cy.get('[data-testid="nav-two-factor"]').should("not.exist");
    });

    it("redirige le DT depuis /account/two-factor", () => {
      cy.visit("/account/two-factor", { failOnStatusCode: false });
      cy.location("pathname", { timeout: 10000 }).should("eq", "/dashboard");
    });
  });
});
