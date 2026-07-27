describe("Mboka Budget — SPEC 8 US-58 Alertes & webhooks", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le panneau de configuration des alertes pour la direction", () => {
    cy.visit("/admin/alerts");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="nav-alertes"]').should("be.visible");
    cy.get('[data-testid="alert-settings-panel"]').should("be.visible");
    cy.get('[data-testid="alert-settings-enabled"]').should("exist");
    cy.get('[data-testid="alert-settings-webhook-url"]').should("be.visible");
    cy.get('[data-testid="alert-settings-ping"]').should("be.visible");
  });

  it("enregistre un seuil de régularisation et envoie un ping test", () => {
    cy.visit("/admin/alerts");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="alert-settings-threshold"]').clear().type("600");
    cy.get('[data-testid="alert-settings-save"]').click();
    cy.contains("Configuration des alertes enregistrée", { timeout: 10000 }).should("be.visible");

    cy.get('[data-testid="alert-settings-ping"]').click();
    cy.contains("Ping", { timeout: 15000 }).should("be.visible");
  });
});
