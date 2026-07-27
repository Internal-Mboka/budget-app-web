describe("Mboka Budget — SPEC 6 Journaux d'audit", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page des journaux d'audit avec filtres", () => {
    cy.visit("/audit");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="nav-audit"]').should("be.visible");
    cy.get('[data-testid="audit-log-filters"]').should("be.visible");
    cy.get('[data-testid="audit-log-immutability-note"]').should("be.visible");
    cy.get('[data-testid="audit-export-csv"]').should("be.visible");
    cy.get('[data-testid="audit-export-json"]').should("be.visible");
  });

  it("ouvre le détail d'une entrée d'audit", () => {
    cy.visit("/audit");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="audit-log-table"]').then(($table) => {
      if ($table.find('[data-testid^="audit-log-link-"]').length === 0) {
        cy.log("Aucune entrée d'audit — test ignoré.");
        return;
      }

      cy.get('[data-testid^="audit-log-link-"]').first().click();
      cy.get('[data-testid="audit-log-detail-panel"]').should("be.visible");
      cy.get('[data-testid="audit-log-detail-ip"]').should("exist");
      cy.get('[data-testid="audit-log-detail-user-agent"]').should("exist");
      cy.get('[data-testid="audit-log-detail-diff"]').should("be.visible");
    });
  });
});
