import { login as sel } from "../selectors";
import { selectDropdownOption } from "../primeng";

/** /auth/login and /auth/organizations. Actions only: callers assert outcomes. */
export const LoginPage = {
  visit(): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.visit("/auth/login");
    return cy.get(sel.email).should("be.visible");
  },

  submit(email: string, password: string): Cypress.Chainable<JQuery<HTMLElement>> {
    cy.get(sel.email).clear().type(email, { log: false });
    cy.get(sel.password).clear().type(password, { log: false });
    return cy.get(sel.submit).should("be.enabled").click();
  },

  /** Multi-organization users only: single-org users are signed in automatically. */
  chooseOrganization(name: string): Cypress.Chainable<JQuery<HTMLElement>> {
    selectDropdownOption(sel.orgDropdown, name);
    return cy.get(sel.orgSubmit).should("be.enabled").click();
  },
};
