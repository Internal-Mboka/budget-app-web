describe("Mboka Budget — US-07 Sessions actives", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page sessions actives", () => {
    cy.visit("/account/sessions", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.contains("Sessions actives").scrollIntoView().should("be.visible");
    cy.get('[data-testid="current-session-badge"]').should("be.visible").and("contain.text", "Appareil actuel");
    cy.get('[data-testid="active-devices-list"]').should("be.visible");
    cy.get('[data-testid="active-sessions-summary"]').should("contain.text", "appareil");
  });

  it("affiche la navigation sessions", () => {
    cy.get('[data-testid="nav-sessions"]')
      .should("exist")
      .and("have.attr", "href", "/account/sessions");
  });

  it("liste la session courante avec navigateur et IP", () => {
    cy.visit("/account/sessions");
    cy.get('[data-testid="current-session-badge"]').should("be.visible");
    cy.contains(/Ordinateur|Mobile|Tablette/).should("be.visible");
    cy.contains("IP").should("be.visible");
    cy.contains("Dernière activité").should("be.visible");
  });

  it("affiche le bouton de déconnexion des autres appareils", () => {
    cy.visit("/account/sessions", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.get('[data-testid="revoke-other-sessions"]')
      .should("exist")
      .and("contain.text", "Déconnecter tous les autres appareils");
  });
});
