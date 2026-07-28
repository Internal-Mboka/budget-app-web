describe("Mboka Budget — US-14 Tagging & segmentation clients", () => {
  beforeEach(function () {
    const email = Cypress.env("DT_EMAIL");
    const password = Cypress.env("DT_PASSWORD");

    if (!email || !password) {
      this.skip();
    }

    cy.loginAsDt();
  });

  it("ajoute et retire des tags depuis le répertoire", () => {
    const uniqueName = `Tag List ${Date.now()}`;

    cy.visit("/clients?pageSize=100");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.contains("article", uniqueName).within(() => {
      cy.contains("button", "Tags").click();
    });

    cy.get('[data-testid="client-tags-dialog"]').should("be.visible");
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-suggestion-vip"]').click();
    });
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "Tag ajouté");
    cy.dismissToasts();
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-vip"]').should("be.visible");

      cy.get('[data-testid="client-tag-suggestion-mauvais-payeur"]').click();
    });
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "Tag ajouté");
    cy.dismissToasts();
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-mauvais-payeur"]').should("be.visible");

      cy.get('[data-testid="client-tag-remove-vip"]').click();
    });
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "Tag retiré");
    cy.dismissToasts();
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-vip"]').should("not.exist");
    });

    cy.get('[data-testid="client-tags-backdrop"]').click({ force: true });
    cy.contains("article", uniqueName).should("contain.text", "Mauvais payeur");
  });

  it("filtre le répertoire par tags (logique ET)", () => {
    const firstClient = `Tag Filter A ${Date.now()}`;
    const secondClient = `Tag Filter B ${Date.now()}`;

    cy.visit("/clients?pageSize=100");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();

    cy.get("#name").type(firstClient);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Particulier");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(firstClient, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get('[data-testid="client-create-form"]').within(() => {
      cy.get("#name").clear({ force: true }).type(secondClient, { force: true });
      cy.contains("button", "Enregistrer le client").should("not.be.disabled").click();
    });
    cy.contains(secondClient, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.get("[data-sonner-toast]", { timeout: 15000 }).should("contain.text", "enregistré");
    cy.dismissToasts();

    cy.contains("article", firstClient).scrollIntoView().within(() => {
      cy.contains("button", "Tags").click();
    });
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-suggestion-vip"]').click();
      cy.dismissToasts();
      cy.get('[data-testid="client-tag-suggestion-résident"]').click();
      cy.dismissToasts();
    });
    cy.get('[data-testid="client-tags-backdrop"]').click({ force: true });

    cy.contains("article", secondClient).scrollIntoView().within(() => {
      cy.contains("button", "Tags").click();
    });
    cy.get('[data-testid="client-tags-dialog"]').within(() => {
      cy.get('[data-testid="client-tag-suggestion-vip"]').click();
      cy.dismissToasts();
    });
    cy.get('[data-testid="client-tags-backdrop"]').click({ force: true });

    cy.get('[data-testid="client-tag-filter"]').scrollIntoView().should("be.visible");
    cy.get('[data-testid="client-tag-filter-vip"]').click();
    cy.location("search", { timeout: 15000 }).should("include", "tags=VIP");
    cy.contains("article", firstClient).scrollIntoView().should("be.visible");
    cy.contains("article", secondClient).scrollIntoView().should("be.visible");

    cy.get('[data-testid="client-tag-filter-résident"]').click();
    cy.location("search", { timeout: 15000 }).should("include", "R");
    cy.contains("article", firstClient).scrollIntoView().should("be.visible");
    cy.contains("article", secondClient).should("not.exist");

    cy.get('[data-testid="client-tag-filter-clear"]').click();
    cy.location("search", { timeout: 15000 }).should("not.include", "tags=");
    cy.contains("article", firstClient).scrollIntoView().should("be.visible");
    cy.contains("article", secondClient).scrollIntoView().should("be.visible");
  });

  it("gère les tags depuis la fiche client", () => {
    const uniqueName = `Tag Detail ${Date.now()}`;

    cy.visit("/clients?pageSize=100");
    cy.get('[data-testid="client-create-form"]').scrollIntoView();
    cy.get("#name").type(uniqueName);
    cy.get('[data-testid="category-trigger"]').scrollIntoView();
    cy.pickMbokaSelect("category", "Artiste indépendant");
    cy.contains("button", "Enregistrer le client").click();
    cy.contains(uniqueName, { timeout: 15000 }).scrollIntoView().should("be.visible");
    cy.dismissToasts();

    cy.contains("a", uniqueName)
      .scrollIntoView()
      .then(($link) => {
        cy.visit($link.attr("href")!, { retryOnStatusCodeFailure: true, timeout: 30000 });
      });

    cy.get('[data-testid="client-tags-section"]').scrollIntoView();
    cy.get('[data-testid="client-tags-editor"]').should("be.visible");
    cy.get('[data-testid="client-tag-suggestion-vip"]').click();
    cy.get('[data-testid="client-tags-list"]', { timeout: 15000 }).should("contain.text", "VIP");

    cy.get('[data-testid="client-detail-tags"]').scrollIntoView().should("contain.text", "VIP");
  });
});
