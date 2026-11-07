/// <reference types="cypress" />
/**
 * Wait-safe helpers for PrimeNG 17 widgets. Every step waits on an assertion
 * (overlay visible / gone, loading finished), never on a fixed delay.
 */

export const exactText = (text: string): RegExp =>
  new RegExp(`^\\s*${text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*$`);

/** Opens a p-dropdown (host selector) and picks the option whose label is exactly `label`. */
export function selectDropdownOption(dropdown: string, label: string): Cypress.Chainable<string> {
  cy.get(dropdown).find(".p-dropdown").should("be.visible").click();
  cy.get(".p-dropdown-panel").should("be.visible").contains("li.p-dropdown-item", exactText(label)).click();
  cy.get(".p-dropdown-panel").should("not.exist");
  return cy
    .get(dropdown)
    .find(".p-dropdown-label")
    .invoke("text")
    .should((text) => expect(text.trim()).to.eq(label));
}

/** Returns the visible p-dialog with the given header title. */
export function getDialog(title: string): Cypress.Chainable<JQuery<HTMLElement>> {
  return cy.contains(".p-dialog .p-dialog-title", title).closest(".p-dialog").should("be.visible");
}

/** Closes the p-dialog with the given title via its header X and waits until it is gone. */
export function closeDialog(title: string): Cypress.Chainable<JQuery<HTMLElement>> {
  getDialog(title).find(".p-dialog-header-close").click();
  return cy.contains(".p-dialog .p-dialog-title", title).should("not.exist");
}

/**
 * Data rows of a p-table once loading has finished. The "no records" row (a single
 * td[colspan]) is excluded. Wait for the data request alias (cy.wait('@x')) first,
 * otherwise the loading check can pass before loading has even started.
 */
export function tableRows(table: string): Cypress.Chainable<JQuery<HTMLElement>> {
  cy.get(table).find(".p-datatable-loading-overlay").should("not.exist");
  return cy
    .get(table)
    .find("tbody.p-datatable-tbody > tr")
    .filter((_, tr) => !(tr.children.length === 1 && tr.children[0].hasAttribute("colspan")));
}

/** Asserts the p-table shows exactly `count` data rows. */
export function tableShouldHaveRows(table: string, count: number): Cypress.Chainable<JQuery<HTMLElement>> {
  return tableRows(table).should("have.length", count);
}
