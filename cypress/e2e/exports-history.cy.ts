describe("Mboka Budget — SPEC 8 US-59 Historique exports", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("donne accès à l'historique des exports au Directeur Technique", () => {
    cy.visit("/exports");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="nav-exports"]').should("be.visible");
    cy.get('[data-testid="exports-history-link"]').click();
    cy.location("pathname").should("eq", "/exports/history");
    cy.get('[data-testid="exports-history-filters"]').should("be.visible");
    cy.get('[data-testid="exports-history-table"]').should("exist");
  });

  it("archive un export CSV et l'affiche dans l'historique", () => {
    cy.visit("/exports?from=2026-01-01&to=2026-12-31&register=revenues");
    cy.dismissPwaPrompt();

    cy.request({
      url: "/api/exports/financial?from=2026-01-01&to=2026-12-31&register=revenues",
      encoding: "binary",
    }).then((response) => {
      expect(response.status).to.eq(200);
    });

    cy.visit("/exports/history");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="exports-history-list"]', { timeout: 10000 }).should("be.visible");
    cy.get('[data-testid^="export-history-row-"]').should("have.length.at.least", 1);
    cy.get('[data-testid^="export-history-download-"]').first().should("be.visible");
    cy.get('[data-testid^="export-history-regenerate-"]').first().should("be.visible");
  });
});
