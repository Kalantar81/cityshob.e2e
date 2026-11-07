import { details as sel } from "../selectors";

/** Event details p-sidebar (events/components/event-details/event-details.component.html). */
export const EventDetails = {
  panel(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.panel);
  },
  clickHandle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.handle).should("be.visible").click();
  },
  clickUnhandle(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.unhandle).should("be.visible").click();
  },
};
