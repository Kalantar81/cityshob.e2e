import { nav, ui } from "../selectors";

/** App shell: navbar + sidebar (root/root-routing.module.ts:8-52). */
export const Navigation = {
  avatar(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(nav.avatar);
  },
  sidebar(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(nav.sidebar);
  },
  clickDashboard(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(nav.dashboard).first().click();
  },
  clickWorkspace(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(nav.workspace(name)).first().click();
  },
  clickLogout(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(nav.logout).click();
  },
  /** Shell rendered, no spinner on screen. */
  shouldBeReady(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.location("pathname").should("not.match", /^\/auth/);
    cy.get(nav.avatar).should("be.visible");
    cy.get(nav.sidebar).should("be.visible");
    cy.get(ui.globalSpinner).should(($el) => expect($el.filter(":visible"), "visible global spinner").to.have.length(0));
    return cy.get(ui.appSpinner).should("not.exist");
  },
};
