describe("Mboka Budget — US-13 Import / export clients", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("affiche le panneau import/export pour le DT", () => {
    cy.visit("/clients");
    cy.get('[data-testid="client-import-export-panel"]').scrollIntoView().should("be.visible");
    cy.get('[data-testid="client-export-link"]').should("have.attr", "href", "/clients/export");
  });

  it("exporte le répertoire clients en CSV", () => {
    cy.request("/clients/export").then((response) => {
      expect(response.status).to.eq(200);
      expect(response.headers["content-type"]).to.include("text/csv");
      expect(response.body).to.include("Nom");
      expect(response.body).to.include("Statut compte");
      expect(response.body).to.match(/affaires cumul/i);
    });
  });

  it("importe un client depuis un CSV valide", () => {
    const uniqueName = `Import CSV ${Date.now()}`;
    const uniquePhone = `+243900${String(Date.now()).slice(-6)}`;
    const fixturePath = `cypress/fixtures/clients-import-${Date.now()}.csv`;
    const csv = `Nom;Catégorie;Téléphone;Email;Adresse;Notes\n${uniqueName};Particulier;${uniquePhone};csv.${Date.now()}@mboka.test;Lubumbashi;Client importé`;

    cy.writeFile(fixturePath, `\uFEFF${csv}`);

    cy.visit("/clients");
    cy.get('[data-testid="client-import-export-panel"]').scrollIntoView();
    cy.get('[data-testid="client-import-file"]').selectFile(fixturePath, { force: true });
    cy.contains("button", "Importer").click();
    cy.get("[data-sonner-toast]", { timeout: 30000 }).should("contain.text", "importé");
    cy.dismissToasts();
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.contains(uniqueName, { timeout: 15000 }).should("exist");
  });
});
