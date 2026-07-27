describe("Mboka Budget — SPEC 8 US-55 Installation PWA", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("expose le manifeste PWA et la page offline", () => {
    cy.request("/manifest.webmanifest").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("application/manifest+json");
      expect(response.body.name).to.eq("Mboka Budget");
      expect(response.body.display).to.eq("standalone");
    });

    cy.request("/offline").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body).to.include("Hors ligne");
    });
  });

  it("affiche le prompt d'installation puis permet de le fermer", () => {
    cy.visit("/dashboard", {
      onBeforeLoad(win) {
        win.localStorage.removeItem("mboka-pwa-install-dismissed");
      },
    });

    cy.get('[data-testid="pwa-dismiss"]', { timeout: 10000 }).should("be.visible");
    cy.contains("Installe l'application").should("be.visible");
    cy.dismissPwaPrompt();
    cy.get('[data-testid="pwa-dismiss"]').should("not.exist");
  });
});
