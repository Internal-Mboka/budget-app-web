describe("Mboka Budget — SPEC 8 US-53 Exports comptables", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page exports avec filtres et actions CSV/PDF", () => {
    cy.visit("/exports");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="nav-exports"]').should("be.visible");
    cy.get('[data-testid="financial-export-filters"]').should("be.visible");
    cy.get('[data-testid="financial-export-csv"]').should("be.visible");
    cy.get('[data-testid="financial-export-pdf"]').should("be.visible");
    cy.get('[data-testid="financial-export-csv-download"]').should("be.visible");
  });

  it("applique une période et conserve les paramètres URL", () => {
    cy.visit("/exports");
    cy.dismissPwaPrompt();

    cy.get('input[name="from"]').clear().type("2026-01-01");
    cy.get('input[name="to"]').clear().type("2026-01-31");
    cy.get('[data-testid="financial-export-apply"]').click();

    cy.location("search").should("include", "from=2026-01-01");
    cy.location("search").should("include", "to=2026-01-31");
  });

  it("télécharge un CSV registre revenus", () => {
    cy.visit("/exports?from=2026-01-01&to=2026-12-31&register=revenues");
    cy.dismissPwaPrompt();

    cy.request({
      url: "/api/exports/financial?from=2026-01-01&to=2026-12-31&register=revenues",
      encoding: "binary",
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("text/csv");
      expect(response.body).to.include("Code");
    });
  });

  it("affiche la pagination PDF quand il y a assez de revenus", () => {
    cy.visit("/exports?from=2026-01-01&to=2026-12-31&pageSize=10");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="financial-export-pdf"]').should("be.visible");
    cy.get('[data-testid="mboka-pagination"]').should("exist");
  });

  it("affiche le bilan périodique pour un mois civil complet", () => {
    cy.visit("/exports?from=2026-07-01&to=2026-07-31");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="financial-export-period-balance"]').should("be.visible");
    cy.get('[data-testid="financial-export-period-balance-preview"]').should("be.visible");
  });

  it("affiche une indication quand la période n'est pas un mois complet", () => {
    cy.visit("/exports?from=2026-07-01&to=2026-07-15");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="financial-export-period-balance-hint"]').should("be.visible");
    cy.get('[data-testid="financial-export-period-balance"]').should("not.exist");
  });

  it("génère un aperçu PDF bilan périodique", () => {
    cy.request({
      url: "/api/exports/period-balance/pdf?from=2026-07-01&to=2026-07-31&preview=1",
      encoding: "binary",
      failOnStatusCode: false,
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("application/pdf");
    });
  });
});
