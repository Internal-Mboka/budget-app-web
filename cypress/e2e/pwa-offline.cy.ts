describe("Mboka Budget — SPEC 8 US-56 Mode hors-ligne partiel", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le bandeau offline et le snapshot dashboard en cache", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.window().then((win) => {
      win.dispatchEvent(new Event("offline"));
    });

    cy.get('[data-testid="pwa-network-offline-banner"]').should("be.visible");
    cy.get('[data-testid="dashboard-offline-snapshot-notice"]').should("be.visible");
    cy.contains("Données mises en cache").should("be.visible");
  });

  it("affiche le bandeau de reconnexion avec action de sync", () => {
    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.window().then((win) => {
      win.dispatchEvent(new Event("offline"));
    });

    cy.get('[data-testid="pwa-network-offline-banner"]').should("be.visible");

    cy.window().then((win) => {
      win.dispatchEvent(new Event("online"));
    });

    cy.get('[data-testid="pwa-network-reconnected-banner"]').should("be.visible");
    cy.get('[data-testid="pwa-network-refresh-button"]').should("be.visible");
    cy.contains("Connexion rétablie").should("be.visible");
  });
});
