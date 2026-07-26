describe("Mboka Budget v2 — Page d'accueil", () => {
  it("affiche le titre Version 2.0", () => {
    cy.visit("/");
    cy.contains("Version 2.0").should("be.visible");
    cy.contains("Mboka Budget").should("be.visible");
  });
});
