import { table as sel } from "../selectors";
import { exactText } from "@common";

/** Events table widget (events/components/events-table/events-table.component.html). */
export const EventsTable = {
  root(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.root);
  },
  rows(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.anyRow);
  },
  row(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.row(id));
  },
  typeSearch(text: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.search).clear().type(text);
  },
  header(column: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.contains(sel.sortableHeader, exactText(column));
  },
  openFilter(field: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.filterToggle(field)).click();
  },
  typeFilterValue(value: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.filterValue).filter(":visible").first().clear().type(value);
  },
  applyFilter(): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.filterApply).filter(":visible").first().click();
  },
  /** Clicking a cell opens details; a second click within 800ms is ignored (events-table.component.ts:1917-1926). */
  clickRow(id: string): Cypress.Chainable<JQuery<HTMLElement>> {
    return cy.get(sel.row(id)).find<HTMLElement>("td").first().click();
  },
};
