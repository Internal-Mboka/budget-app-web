describe("Mboka Budget — US-06 Permissions par rôle", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche la page permissions pour le DT", () => {
    cy.visit("/admin/roles", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.contains("Permissions par rôle").scrollIntoView().should("be.visible");
    cy.contains("Grille des permissions").scrollIntoView().should("be.visible");
  });

  it("affiche la navigation permissions pour le DT", () => {
    cy.get('[data-testid="nav-permissions"]')
      .should("exist")
      .and("have.attr", "href", "/admin/roles");
  });

  it("accorde et retire une permission pour le rôle Secrétaire", () => {
    cy.visit("/admin/roles", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.pickMbokaSelect("roleId", "Secrétaire");

    cy.get('[data-testid="permission-audit:view-input"]').as("auditCheckbox");
    cy.get("@auditCheckbox").should("not.be.checked");

    cy.get("@auditCheckbox").check({ force: true });
    cy.get("@auditCheckbox", { timeout: 15000 }).should("be.checked");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("exist");
    cy.dismissToasts();

    cy.get("@auditCheckbox").uncheck({ force: true });
    cy.get("@auditCheckbox", { timeout: 15000 }).should("not.be.checked");
    cy.dismissToasts();
  });

  it("empêche de retirer IAM aux rôles administrateurs", () => {
    cy.visit("/admin/roles", { retryOnStatusCodeFailure: true, timeout: 30000 });
    cy.pickMbokaSelect("roleId", "Directeur Technique");

    cy.get('[data-testid="permission-users:manage-input"]')
      .should("be.checked")
      .uncheck({ force: true });

    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "IAM");
    cy.get('[data-testid="permission-users:manage-input"]').should("be.checked");
    cy.dismissToasts();
  });
});
