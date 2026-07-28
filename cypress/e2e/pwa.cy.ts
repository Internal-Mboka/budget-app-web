describe("Mboka Budget — SPEC 8 US-55 Installation PWA", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("expose un manifeste PWA complet", () => {
    cy.request("/manifest.webmanifest").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("application/manifest+json");
      expect(response.body.name).to.eq("Mboka Budget");
      expect(response.body.short_name).to.eq("Mboka");
      expect(response.body.lang).to.eq("fr");
      expect(response.body.display).to.eq("standalone");
      expect(response.body.start_url).to.eq("/dashboard");
      expect(response.body.icons).to.have.length.at.least(2);
    });
  });

  it("affiche une page offline brandée Mboka", () => {
    cy.visit("/offline");
    cy.get('[data-testid="offline-fallback-screen"]').should("be.visible");
    cy.contains("Vous êtes hors ligne").should("be.visible");
    cy.get('[data-testid="offline-retry-button"]').should("be.visible");
  });

  it("affiche le prompt d'installation sur le dashboard puis permet de le fermer", () => {
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        win.localStorage.removeItem("mboka-pwa-install-dismissed");
        win.localStorage.removeItem("mboka-pwa-install-dismissed-at");
      },
    });

    cy.get('[data-testid="pwa-install-prompt"]', { timeout: 12000 }).should("be.visible");
    cy.contains("Installez Mboka Budget").should("be.visible");
    cy.dismissPwaPrompt();
    cy.get('[data-testid="pwa-install-prompt"]').should("not.exist");
  });

  it("n'affiche pas le prompt sur la page de connexion", () => {
    cy.visit("/login", {
      onBeforeLoad(win) {
        win.localStorage.removeItem("mboka-pwa-install-dismissed");
        win.localStorage.removeItem("mboka-pwa-install-dismissed-at");
      },
    });

    cy.wait(2500);
    cy.get('[data-testid="pwa-install-prompt"]').should("not.exist");
  });
});
