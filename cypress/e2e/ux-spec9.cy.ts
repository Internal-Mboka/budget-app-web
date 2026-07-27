describe("Mboka Budget — SPEC 9 Ergonomie UX", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le toggle thème avec zone tactile adaptée", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="theme-toggle"]').should("be.visible");
    cy.get('[data-testid="theme-toggle"]').invoke("outerWidth").should("be.gte", 44);
    cy.get('[data-testid="theme-toggle"]').invoke("outerHeight").should("be.gte", 44);
  });

  it("ouvre le menu mobile avec une cible tactile suffisante", () => {
    cy.viewport(390, 844);
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="app-mobile-menu-button"]').should("be.visible");
    cy.get('[data-testid="app-mobile-menu-button"]').invoke("outerWidth").should("be.gte", 44);
    cy.get('[data-testid="app-mobile-menu-button"]').click();
    cy.get('[data-testid="nav-revenues"]').should("be.visible");
  });

  it("focus automatiquement le champ client sur le formulaire revenu", () => {
    cy.visit("/revenues/new");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="client-autocomplete-input"]').should("be.focused");
  });

  it("navigue vers une nouvelle transaction via Ctrl+Shift+N", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get("body").type("{ctrl}{shift}N");
    cy.location("pathname").should("eq", "/revenues/new");
  });
});
