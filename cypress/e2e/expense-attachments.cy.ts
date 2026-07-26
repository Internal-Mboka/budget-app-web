describe("Mboka Budget — US-27 Pièces justificatives dépenses", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("téléverse et affiche une pièce justificative sur une dépense", () => {
    cy.visit("/expenses/new");
    cy.dismissPwaPrompt();

    cy.pickMbokaSelect("expenseCategory", "Matériel & équipement");
    cy.get("#label").type("Facture test US-27");
    cy.get("#totalAmount").clear().type("45");
    cy.pickMbokaSelect("paymentMethod", "Espèces");
    cy.get('[data-testid="expense-create-submit"]').click();

    cy.get('[data-testid="expense-detail-panel"]', { timeout: 15000 }).should("be.visible");
    cy.get('[data-testid="expense-attachments-section"]').should("be.visible");
    cy.get('[data-testid="expense-attachments-empty"]').should("be.visible");

    cy.fixture("receipt.png", "binary").then((fileContent) => {
      cy.get("#expenseAttachmentFile").selectFile(
        {
          contents: Cypress.Blob.binaryStringToBlob(fileContent, "image/png"),
          fileName: "receipt.png",
          mimeType: "image/png",
        },
        { force: true }
      );
    });

    cy.get('[data-testid="expense-attachment-submit"]').click();
    cy.get('[data-testid="expense-attachments-list"]', { timeout: 15000 }).should("be.visible");
    cy.contains("receipt.png").should("be.visible");
    cy.dismissToasts();
  });
});
