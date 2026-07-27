describe("Mboka Budget — SPEC 10 US-78 Validation clôture trimestrielle", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.task("resetFiscalPeriodOpen");
    cy.loginAsDt();
  });

  afterEach(() => {
    cy.task("resetFiscalPeriodOpen");
  });

  it("affiche la file de clôture et la navigation pour le DT quand le trimestre est CLOSING", () => {
    cy.task("setFiscalPeriodStatus", "CLOSING");

    cy.visit("/dashboard");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-banner"]').should("be.visible");
    cy.get('[data-testid="fiscal-period-closing-banner-link"]')
      .should("be.visible")
      .contains("Voir la clôture")
      .click();

    cy.location("pathname").should("eq", "/dashboard/cloture-trimestre");
    cy.get('[data-testid="fiscal-period-closing-panel"]').should("be.visible");
    cy.get('[data-testid="nav-fiscal-period-closing"]').should("be.visible");
    cy.contains("Visa comptable en attente").should("be.visible");
  });

  it("empêche le DT de valider la clôture (lecture seule)", () => {
    cy.task("setFiscalPeriodStatus", "CLOSING");
    cy.task("setFiscalPeriodAccountantVisa");

    cy.visit("/dashboard/cloture-trimestre");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-list"]').should("be.visible");
    cy.contains("Validation PDG en attente").should("be.visible");
    cy.get('[data-testid^="fiscal-period-closing-approve-"]').should("not.exist");
    cy.get('[data-testid="fiscal-period-closing-readonly-notice"]').should("be.visible");
    cy.contains("Validation réservée au PDG").should("be.visible");
  });
});

describe("Mboka Budget — SPEC 10 US-78/US-79 Validation clôture (PDG)", () => {
  beforeEach(function () {
    const email = Cypress.env("PDG_EMAIL");
    const password = Cypress.env("PDG_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.task("resetFiscalPeriodOpen");
    cy.loginAsPdg();
  });

  afterEach(() => {
    cy.task("resetFiscalPeriodOpen");
  });

  it("permet au PDG de valider après visa comptable simulé", () => {
    cy.task("setFiscalPeriodStatus", "CLOSING");
    cy.task("setFiscalPeriodAccountantVisa");

    cy.visit("/dashboard/cloture-trimestre");
    cy.dismissPwaPrompt();

    cy.get('[data-testid="fiscal-period-closing-list"]').should("be.visible");
    cy.get('[data-testid^="fiscal-period-closing-approve-"]').first().click();

    cy.location("search", { timeout: 20000 }).should("include", "approved=1");
    cy.get('[data-testid="fiscal-period-closing-success"]').should("be.visible");
    cy.contains("trimestre suivant").should("be.visible");
    cy.get('[data-testid="fiscal-period-closing-empty"]').should("be.visible");

    cy.get('[data-testid="fiscal-period-closing-recap-section"]').should("be.visible");
    cy.get('[data-testid^="fiscal-period-closing-recap-"]').should("have.length.at.least", 1);

    cy.task("getFiscalPeriodStatusCounts").should("deep.equal", {
      open: 1,
      closing: 0,
      closed: 1,
    });

    cy.visit("/dashboard");
    cy.dismissPwaPrompt();
    cy.get('[data-testid="fiscal-period-closing-banner"]').should("not.exist");
    cy.get('[data-testid="nav-fiscal-period-closing"]').should("not.exist");
  });

  it("ouvre automatiquement le trimestre suivant après validation PDG", () => {
    cy.task("setFiscalPeriodStatus", "CLOSING");
    cy.task("setFiscalPeriodAccountantVisa");

    cy.visit("/dashboard/cloture-trimestre");
    cy.dismissPwaPrompt();
    cy.get('[data-testid^="fiscal-period-closing-approve-"]').first().click();
    cy.get('[data-testid="fiscal-period-closing-success"]').should("be.visible");

    cy.task("getFiscalPeriodStatusCounts").should("deep.equal", {
      open: 1,
      closing: 0,
      closed: 1,
    });
  });
});
