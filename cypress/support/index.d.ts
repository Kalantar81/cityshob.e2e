/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /** Logs in as `role` via the UI once and caches it with cy.session(). */
    login(role: string): Chainable<void>;
    /** Gets element(s) by `data-cy` or `data-testid`. */
    getByDataCy(id: string): Chainable<JQuery<HTMLElement>>;
  }
}
